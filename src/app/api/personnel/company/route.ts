import { NextResponse } from 'next/server';
import { dbConnect } from '@/utils/dbConnect';
import Personnel from '@/models/Personnel';
import { validateToken } from '@/lib/auth';
import User from '@/models/User';
import Company from '@/models/Company';

export const dynamic = 'force-dynamic';

/**
 * GET handler to retrieve personnel data filtered by company and role
 */
export async function GET(request: Request) {
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
    
    // Check if user has permission
    const user = await User.findById(decoded.userId);
    if (!user || !['administrator', 'admin', 'director', 'staff'].includes(user.role)) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized: Admin or Staff access required' }, 
        { status: 403 }
      );
    }
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const companyName = searchParams.get('company');
    const role = searchParams.get('role');
    
    if (!companyName) {
      return NextResponse.json(
        { success: false, message: 'Company name is required' }, 
        { status: 400 }
      );
    }
    
    // Build query
    const query: any = {};
    
    // Add company filter using case-insensitive regex
    query.company = new RegExp(companyName, 'i');
    
    // Add role filter if specified
    if (role) {
      query.role = role.toLowerCase();
    }
    
    console.log('Query:', JSON.stringify(query));
    
    // Execute query to get personnel in the company
    const personnel = await Personnel.find(query).lean();
    
    console.log(`Found ${personnel.length} personnel records matching the query`);
    
    // Log the first record for debugging (redacting sensitive data)
    if (personnel.length > 0) {
      const sampleRecord = { ...personnel[0] };
      // Redact sensitive fields for logging
      if (sampleRecord.password) sampleRecord.password = '[REDACTED]';
      if (sampleRecord.resetPasswordToken) sampleRecord.resetPasswordToken = '[REDACTED]';
      if (sampleRecord.resetVerificationCode) sampleRecord.resetVerificationCode = '[REDACTED]';
      console.log('Sample record:', JSON.stringify(sampleRecord, null, 2));
    }
    
    // Create response with cache control to prevent browser caching
    const response = NextResponse.json({
      success: true,
      data: personnel,
      count: personnel.length
    });
    
    // Set cache control headers to prevent browser caching
    response.headers.set('Cache-Control', 'no-store, max-age=0');
    
    return response;
  } catch (error: any) {
    console.error('Error fetching personnel by company:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error fetching personnel' },
      { status: 500 }
    );
  }
} 