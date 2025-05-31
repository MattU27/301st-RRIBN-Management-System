import { NextResponse } from 'next/server';
import { dbConnect } from '@/utils/dbConnect';
import Personnel from '@/models/Personnel';
import Document, { DocumentStatus } from '@/models/Document';
import Training from '@/models/Training';
import { verifyJWT } from '@/utils/auth';
import mongoose from 'mongoose';

/**
 * GET handler to retrieve personnel statistics
 */
export async function GET(request: Request) {
  try {
    // Connect to MongoDB
    await dbConnect();
    
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const token = authHeader.split(' ')[1];
    const decoded = await verifyJWT(token);
    
    if (!decoded) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      );
    }
    
    // Get all personnel
    const allPersonnel = await Personnel.find().lean();
    
    // Count personnel by status - use case-insensitive check for status values
    const readyCount = allPersonnel.filter(p => 
      p.status === 'ready' || 
      p.status === 'Ready' || 
      p.status?.toLowerCase() === 'ready'
    ).length;
    
    const standbyCount = allPersonnel.filter(p => 
      p.status === 'standby' || 
      p.status === 'Standby' || 
      p.status?.toLowerCase() === 'standby'
    ).length;
    
    const retiredCount = allPersonnel.filter(p => 
      p.status === 'retired' || 
      p.status === 'Retired' || 
      p.status?.toLowerCase() === 'retired'
    ).length;
    
    // Legacy active count alias - for backward compatibility
    const activeCount = readyCount;
    
    // Count personnel by role
    const adminCount = allPersonnel.filter(p => p.role === 'admin').length;
    const directorCount = allPersonnel.filter(p => p.role === 'director').length;
    const staffCount = allPersonnel.filter(p => p.role === 'staff').length;
    const reservistCount = allPersonnel.filter(p => p.role === 'reservist').length;
    
    // Get counts by company
    const companies = Array.from(new Set(allPersonnel.map(p => p.company))).filter(Boolean);
    
    // Calculate company-level statistics
    const companyStats = await Promise.all(
      companies.map(async (company) => {
        // Get personnel in this company
        const personnel = allPersonnel.filter(p => p.company === company);
        const personnelIds = personnel.map(p => p._id);
        
        // Calculate document completion for company
        const companyDocuments = await Document.find({
          uploadedBy: { $in: personnelIds.map(id => new mongoose.Types.ObjectId(String(id))) }
        }).lean();
        
        const totalDocs = companyDocuments.length;
        const verifiedDocs = companyDocuments.filter(d => d.status === DocumentStatus.VERIFIED).length;
        const documentsCompletePercentage = totalDocs > 0 ? Math.round((verifiedDocs / totalDocs) * 100) : 0;
        
        // Calculate training completion for company
        const trainings = await Training.find().lean();
        let totalRegistrations = 0;
        let completedRegistrations = 0;
        
        trainings.forEach(training => {
          if (training.attendees && Array.isArray(training.attendees)) {
            training.attendees.forEach(attendee => {
              // Check if attendee is from this company
              const attendeeId = String(attendee.userId);
              const personnelIndex = personnelIds.findIndex(id => String(id) === attendeeId);
              
              if (personnelIndex !== -1) {
                totalRegistrations++;
                if (attendee.status === 'completed') {
                  completedRegistrations++;
                }
              }
            });
          }
        });
        
        const trainingsCompletePercentage = totalRegistrations > 0 
          ? Math.round((completedRegistrations / totalRegistrations) * 100) 
          : 0;
        
        // Count ready personnel (instead of active)
        const readyPersonnel = personnel.filter(p => 
          p.status === 'ready' || 
          p.status === 'Ready' || 
          p.status?.toLowerCase() === 'ready'
        ).length;
        
        // Calculate overall readiness score for company
        const readinessScore = Math.round(
          (documentsCompletePercentage * 0.3) + 
          (trainingsCompletePercentage * 0.5) + 
          ((readyPersonnel / personnel.length) * 100 * 0.2)
        );
        
        return {
          company,
          personnel: personnel.length,
          readyPersonnel: readyPersonnel,
          documentsComplete: documentsCompletePercentage,
          trainingsComplete: trainingsCompletePercentage,
          readinessScore: Math.min(readinessScore, 100)
        };
      })
    );
    
    // Build response data
    const stats = {
      total: allPersonnel.length,
      active: activeCount,
      readyPersonnel: readyCount,
      standby: standbyCount,
      retired: retiredCount,
      byRole: {
        admin: adminCount,
        director: directorCount,
        staff: staffCount,
        reservist: reservistCount
      },
      companies: companyStats
    };
    
    return NextResponse.json({
      success: true,
      data: stats
    });
  } catch (error: any) {
    console.error('Error fetching personnel statistics:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error fetching personnel statistics' },
      { status: 500 }
    );
  }
} 