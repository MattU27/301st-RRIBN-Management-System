import { NextResponse } from 'next/server';
import { dbConnect } from '@/utils/dbConnect';
import Personnel from '@/models/Personnel';
import { validateToken } from '@/lib/auth';
import User from '@/models/User';
import AuditLog from '@/models/AuditLog';
import mongoose from 'mongoose';
import Company from '@/models/Company';

export const dynamic = 'force-dynamic';

// Define the valid companies to match the UI options
const VALID_COMPANIES = [
  'Alpha',
  'Bravo',
  'Charlie', 
  'Headquarters',
  'NERRSC (NERR-Signal Company)',
  'NERRFAB (NERR-Field Artillery Battery)'
];

// Helper to find company ID from company name
async function getCompanyIdByName(companyName: string): Promise<string | null> {
  try {
    console.log(`Searching for company: "${companyName}"`);
    
    // Create a mapping of UI display names to actual database names and codes
    const companyMappings: Record<string, { name: string, code: string }> = {
      'Alpha': { name: 'Alpha Company', code: 'ALPHA' },
      'Bravo': { name: 'Bravo Company', code: 'BRAVO' },
      'Charlie': { name: 'Charlie Company', code: 'CHARLIE' },
      'Headquarters': { name: 'Headquarters', code: 'HEADQUARTERS' },
      'HQ': { name: 'Headquarters', code: 'HEADQUARTERS' },
      'NERRSC': { name: 'NERRSC (NERR-Signal Company)', code: 'NERRSC' },
      'NERR-Signal Company': { name: 'NERRSC (NERR-Signal Company)', code: 'NERRSC' },
      'NERRSC (NERR-Signal Company)': { name: 'NERRSC (NERR-Signal Company)', code: 'NERRSC' },
      'NERRFAB': { name: 'NERRFAB (NERR-Field Artillery Battery)', code: 'NERRFAB' },
      'NERR-Field Artillery Battery': { name: 'NERRFAB (NERR-Field Artillery Battery)', code: 'NERRFAB' },
      'NERRFAB (NERR-Field Artillery Battery)': { name: 'NERRFAB (NERR-Field Artillery Battery)', code: 'NERRFAB' }
    };
    
    // Get the mapping for this company name if it exists
    const mapping = companyMappings[companyName];
    
    // Try to find company by exact name or code match first using the mapping
    let company = null;
    
    if (mapping) {
      console.log(`Using mapping: name="${mapping.name}", code="${mapping.code}"`);
      company = await Company.findOne({ 
        $or: [
          { name: mapping.name },
          { code: mapping.code }
        ]
      });
    }
    
    // If no mapping or company not found with mapping, try the original name
    if (!company) {
      company = await Company.findOne({ 
        $or: [
          { name: companyName },
          { code: companyName }
        ]
      });
    }
    
    // If still not found, try case-insensitive regex search
    if (!company) {
      console.log('No exact match found, trying regex search');
      company = await Company.findOne({ 
        $or: [
          { name: new RegExp('^' + companyName.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&') + '$', 'i') },
          { code: new RegExp('^' + companyName.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&') + '$', 'i') }
        ]
      });
    }
    
    if (company) {
      console.log(`Found company: ${company.name} with ID: ${company._id}`);
      return company._id.toString();
    }
    
    console.log(`No company found for "${companyName}"`);
    
    // If still not found, create a fallback approach
    // For the specific company names in the UI dropdown, we'll create a new company
    if (VALID_COMPANIES.includes(companyName as any) || mapping) {
      console.log(`Company "${companyName}" is in valid list, but not found in DB. Using fallback approach`);
      
      // Get the company details from the mapping or use defaults
      const companyDetails = mapping || { 
        name: companyName, 
        code: companyName.split(' ')[0].toUpperCase() 
      };
      
      // Create the company if it doesn't exist
      const newCompany = new Company({
        name: companyDetails.name,
        code: companyDetails.code, 
        description: `${companyDetails.name} Company`,
      });
      
      try {
        const savedCompany = await newCompany.save();
        console.log(`Created new company: ${savedCompany.name} with ID: ${savedCompany._id}`);
        return savedCompany._id.toString();
      } catch (error) {
        console.error(`Failed to create company: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error finding company by name:', error);
    return null;
  }
}

// Simple in-memory rate limiter
const searches = new Map<string, { count: number, timestamp: number }>();
const RATE_LIMIT_WINDOW = 5000; // 5 seconds
const RATE_LIMIT_MAX = 10; // 10 requests per 5 seconds

// Helper function to log administrator actions
async function logAdminAction(
  userId: string,
  userName: string,
  userRole: string,
  action: string,
  resourceId: string,
  details: string,
  request: Request
) {
  try {
    const auditLog = new AuditLog({
      timestamp: new Date(),
      userId,
      userName,
      userRole,
      action,
      resource: 'personnel',
      resourceId,
      details,
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown'
    });
    
    await auditLog.save();
    console.log(`${action} action logged to audit system`);
  } catch (auditError) {
    // Don't fail the main operation if audit logging fails
    console.error('Error logging to audit system:', auditError);
  }
}

// Normalize status values to ensure only valid statuses are saved
function normalizeStatus(status: string) {
  // Convert to lowercase for consistent comparison
  const statusLower = status?.toLowerCase();
  
  // If status is already valid, return it lowercase
  if (statusLower === 'ready' || statusLower === 'standby' || statusLower === 'retired') {
    return statusLower;
  }
  
  // Map specific statuses to valid ones
  if (statusLower === 'active') {
    return 'ready';
  }
  
  if (statusLower === 'inactive' || statusLower === 'medical' || statusLower === 'leave') {
    return 'retired';
  }
  
  if (statusLower === 'pending' || statusLower === 'deployed') {
    return 'standby';
  }
  
  // Default fallback
  return 'standby';
}

// Add this section near the top of the file, with other data validation functions
const validatePersonnelData = (data: any) => {
  const errors = [];
  
  // Check required fields
  const requiredFields = ['name', 'email', 'rank', 'status'];
  for (const field of requiredFields) {
    if (!data[field]) {
      errors.push(`${field} is required`);
    }
  }
  
  // Check company field - either company or companyName should be provided
  if (!data.company && !data.companyName) {
    errors.push(`Company is required`);
  }
  
  // Validate email format if provided
  if (data.email && !data.email.match(/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/)) {
    errors.push("Email address is not valid");
  }
  
  // Validate dateJoined if provided
  if (data.dateJoined) {
    try {
      // Check if it's a valid date
      const date = new Date(data.dateJoined);
      if (isNaN(date.getTime())) {
        errors.push("dateJoined must be a valid date");
      }
    } catch (error) {
      errors.push("dateJoined must be a valid date");
    }
  }
  
  return errors;
};

/**
 * GET handler to retrieve personnel data
 */
export async function GET(request: Request) {
  try {
    // Get client IP for rate limiting
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    
    // Rate limiting
    const now = Date.now();
    const userSearches = searches.get(ip) || { count: 0, timestamp: now };
    
    // Reset counter if window expired
    if (now - userSearches.timestamp > RATE_LIMIT_WINDOW) {
      userSearches.count = 0;
      userSearches.timestamp = now;
    }
    
    // Increment count
    userSearches.count++;
    searches.set(ip, userSearches);
    
    // Check rate limit
    if (userSearches.count > RATE_LIMIT_MAX) {
      return NextResponse.json(
        { success: false, error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    // Connect to MongoDB
    await dbConnect();
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const company = searchParams.get('company');
    const status = searchParams.get('status');
    const pageSize = searchParams.get('pageSize') ? parseInt(searchParams.get('pageSize')!) : 10;
    const page = searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1;
    
    // Build query
    const query: any = {};
    if (company) query.company = company;
    if (status) query.status = status;
    
    // Add search functionality
    if (search && search.trim() !== '') {
      // Create a more flexible search query
      const searchRegex = new RegExp(search.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&'), 'i');
      query.$or = [
        { name: { $regex: searchRegex } },
        { rank: { $regex: searchRegex } },
        { email: { $regex: searchRegex } },
        { serviceNumber: { $regex: searchRegex } },
      ];
    }
    
    // Execute query with optimized options
    const skip = (page - 1) * pageSize;
    const personnel = await Personnel.find(query, {}, { lean: true })
      .skip(skip)
      .limit(pageSize)
      .sort({ lastUpdated: -1 });
    
    // Get total count for pagination
    const total = await Personnel.countDocuments(query);
    const totalPages = Math.ceil(total / pageSize);
    
    // Create response with cache control to prevent browser caching
    const response = NextResponse.json({
      success: true,
      data: {
        personnel,
        totalPages,
        pagination: {
          total,
          page,
          pageSize,
          pages: totalPages,
        },
      },
    });
    
    // Set cache control headers to prevent browser caching
    response.headers.set('Cache-Control', 'no-store, max-age=0');
    
    return response;
  } catch (error: any) {
    console.error('Error fetching personnel:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error fetching personnel' },
      { status: 500 }
    );
  }
}

/**
 * POST handler to create a new personnel record
 */
export async function POST(request: Request) {
  try {
    // Connect to MongoDB
    await dbConnect();
    
    // Validate token
    const token = request.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Authentication token is required' }, 
        { status: 401 }
      );
    }
    
    const decoded = await validateToken(token);
    if (!decoded || !decoded.userId) {
      return NextResponse.json(
        { success: false, message: 'Invalid token' }, 
        { status: 401 }
      );
    }
    
    // Check if user is admin
    const user = await User.findById(decoded.userId);
    if (!user || (user.role !== 'administrator' && user.role !== 'admin' && user.role !== 'director')) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized: Admin access required' }, 
        { status: 403 }
      );
    }
    
    // Parse request body
    const newPersonnelData = await request.json();
    
    // Normalize status if present
    if (newPersonnelData.status) {
      newPersonnelData.status = normalizeStatus(newPersonnelData.status);
    }
    
    // Handle special company name field (added to avoid ObjectId issues)
    if (newPersonnelData.companyName && typeof newPersonnelData.companyName === 'string') {
      console.log('Using companyName field instead of company:', newPersonnelData.companyName);
      // Use companyName to set the company field if needed
      if (!newPersonnelData.company) {
        newPersonnelData.company = newPersonnelData.companyName;
      }
      // Remove companyName to avoid confusion with the database
      delete newPersonnelData.companyName;
    }
    
    // Handle company names vs IDs
    if (newPersonnelData.company && typeof newPersonnelData.company === 'string') {
      if (mongoose.isValidObjectId(newPersonnelData.company)) {
        console.log('Company is already a valid ObjectId:', newPersonnelData.company);
      } else {
        // Look up the company ID from the name
        console.log('Converting company name to ID:', newPersonnelData.company);
        try {
          const companyId = await getCompanyIdByName(newPersonnelData.company);
          if (companyId) {
            console.log(`Successfully converted company "${newPersonnelData.company}" to ID: ${companyId}`);
            newPersonnelData.company = companyId;
          } else {
            // If company can't be found, log this but don't remove the field
            // This will let MongoDB's validation handle it
            console.log(`Company "${newPersonnelData.company}" not found, but keeping original value`);
          }
        } catch (error) {
          console.error('Error converting company name to ID:', error);
          // Don't remove the field - let MongoDB validation handle it
        }
      }
    }
    
    // Create new personnel
    const personnel = new Personnel(newPersonnelData);
    const savedPersonnel = await personnel.save();
    
    // Log the admin action
    await logAdminAction(
      decoded.userId,
      `${user.firstName} ${user.lastName}`,
      user.role,
      'create',
      savedPersonnel._id.toString(),
      `Created personnel record: ${savedPersonnel.name.firstName} ${savedPersonnel.name.lastName} (${savedPersonnel.serviceNumber})`,
      request
    );
    
    return NextResponse.json({
      success: true,
      data: savedPersonnel
    });
  } catch (error: any) {
    console.error('Error creating personnel:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map((err: any) => err.message);
      return NextResponse.json(
        { 
          success: false, 
          message: 'Validation error', 
          errors: validationErrors 
        }, 
        { status: 400 }
      );
    }
    
    // Handle duplicate key errors
    if (error.code === 11000) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Duplicate entry error', 
          error: `A record with this ${Object.keys(error.keyValue)[0]} already exists.` 
        }, 
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to create personnel record', 
        error: error.message 
      }, 
      { status: 500 }
    );
  }
}

/**
 * DELETE handler to remove a personnel record
 */
export async function DELETE(request: Request) {
  try {
    // Connect to MongoDB
    await dbConnect();
    
    // Get personnel ID from URL
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Personnel ID is required' }, 
        { status: 400 }
      );
    }
    
    // Validate token
    const token = request.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Authentication token is required' }, 
        { status: 401 }
      );
    }
    
    const decoded = await validateToken(token);
    if (!decoded || !decoded.userId) {
      return NextResponse.json(
        { success: false, message: 'Invalid token' }, 
        { status: 401 }
      );
    }
    
    // Check if user is admin
    const user = await User.findById(decoded.userId);
    if (!user || (user.role !== 'administrator' && user.role !== 'admin' && user.role !== 'director')) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized: Admin access required' }, 
        { status: 403 }
      );
    }
    
    // Find personnel by ID
    const personnel = await Personnel.findById(id);
    if (!personnel) {
      return NextResponse.json(
        { success: false, message: 'Personnel not found' }, 
        { status: 404 }
      );
    }
    
    // Delete personnel
    await Personnel.findByIdAndDelete(id);
    
    // Log the admin action
    await logAdminAction(
      decoded.userId,
      `${user.firstName} ${user.lastName}`,
      user.role,
      'delete',
      id,
      `Deleted personnel record: ${personnel.name.firstName} ${personnel.name.lastName} (${personnel.serviceNumber})`,
      request
    );
    
    return NextResponse.json({
      success: true,
      message: 'Personnel deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting personnel:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to delete personnel record', 
        error: error.message 
      }, 
      { status: 500 }
    );
  }
}

// PUT handler to update personnel
export async function PUT(request: Request) {
  try {
    // Connect to MongoDB
    await dbConnect();
    
    // Validate token
    const token = request.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Authentication token is required' }, 
        { status: 401 }
      );
    }
    
    const decoded = await validateToken(token);
    if (!decoded || !decoded.userId) {
      return NextResponse.json(
        { success: false, message: 'Invalid token' }, 
        { status: 401 }
      );
    }
    
    // Check if user is admin
    const user = await User.findById(decoded.userId);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' }, 
        { status: 404 }
      );
    }
    
    // Allow staff, admin, and director roles to update personnel
    const allowedRoles = ['staff', 'administrator', 'admin', 'director'];
    if (!allowedRoles.includes(user.role)) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized: You do not have permission to update personnel records' }, 
        { status: 403 }
      );
    }
    
    // Parse request body
    const { id, data } = await request.json();
    
    if (!id || !data) {
      return NextResponse.json(
        { success: false, message: 'Personnel ID and update data are required' }, 
        { status: 400 }
      );
    }
    
    // Validate the data
    const validationErrors = validatePersonnelData(data);
    if (validationErrors.length > 0) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Validation error', 
          errors: validationErrors 
        }, 
        { status: 400 }
      );
    }
    
    // Normalize status if present
    if (data.status) {
      data.status = normalizeStatus(data.status);
    }
    
    // Handle special company name field (added to avoid ObjectId issues)
    if (data.companyName && typeof data.companyName === 'string') {
      console.log('Using companyName field instead of company:', data.companyName);
      // Use companyName to set the company field if needed
      if (!data.company) {
        data.company = data.companyName;
      }
      // Remove companyName to avoid confusion with the database
      delete data.companyName;
    }
    
    // Handle company names vs IDs
    if (data.company && typeof data.company === 'string') {
      if (mongoose.isValidObjectId(data.company)) {
        console.log('Company is already a valid ObjectId:', data.company);
      } else {
        // Look up the company ID from the name
        console.log('Converting company name to ID:', data.company);
        try {
          const companyId = await getCompanyIdByName(data.company);
          if (companyId) {
            console.log(`Successfully converted company "${data.company}" to ID: ${companyId}`);
            data.company = companyId;
          } else {
            // If company can't be found, log this but don't remove the field
            // This will let MongoDB's validation handle it
            console.log(`Company "${data.company}" not found, but keeping original value`);
          }
        } catch (error) {
          console.error('Error converting company name to ID:', error);
          // Don't remove the field - let MongoDB validation handle it
        }
      }
    }
    
    // Find personnel by ID
    const personnel = await Personnel.findById(id);
    if (!personnel) {
      return NextResponse.json(
        { success: false, message: 'Personnel not found' }, 
        { status: 404 }
      );
    }
    
    // Update personnel
    const updatedPersonnel = await Personnel.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true, runValidators: true }
    );
    
    // Log the admin action
    await logAdminAction(
      decoded.userId,
      `${user.firstName} ${user.lastName}`,
      user.role,
      'update',
      id,
      `Updated personnel record: ${personnel.name.firstName} ${personnel.name.lastName} (${personnel.serviceNumber})`,
      request
    );
    
    return NextResponse.json({
      success: true,
      data: updatedPersonnel
    });
  } catch (error: any) {
    console.error('Error updating personnel:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map((err: any) => err.message);
      return NextResponse.json(
        { 
          success: false, 
          message: 'Validation error', 
          errors: validationErrors 
        }, 
        { status: 400 }
      );
    }
    
    // Better error message for specific fields
    if (error.message.includes('dateJoined')) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Invalid date format for Date Joined field', 
          error: 'Please enter a valid date in the format YYYY-MM-DD' 
        }, 
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to update personnel record', 
        error: error.message 
      }, 
      { status: 500 }
    );
  }
} 