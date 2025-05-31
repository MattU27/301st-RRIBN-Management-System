import { NextResponse } from 'next/server';
import { dbConnect } from '@/utils/dbConnect';
import User from '@/models/User';
import Document from '@/models/Document';
import Training from '@/models/Training';
import { UserRole, UserStatus } from '@/models/User';
import { DocumentStatus, DocumentType } from '@/models/Document';
import { TrainingStatus } from '@/models/Training';

/**
 * GET handler to retrieve database statistics
 */
export async function GET() {
  try {
    // Connect to MongoDB
    await dbConnect();

    // Collect user statistics
    const totalUsers = await User.countDocuments();
    const usersByRole = await User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } },
    ]);
    
    const usersByStatus = await User.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);
    
    const usersByCompany = await User.aggregate([
      { $match: { company: { $exists: true } } },
      { $group: { _id: '$company', count: { $sum: 1 } } },
    ]);

    // Collect document statistics
    const totalDocuments = await Document.countDocuments();
    const documentsByType = await Document.aggregate([
      { $group: { _id: '$type', count: { $sum: 1 } } },
    ]);
    
    const documentsByStatus = await Document.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    // Collect training statistics
    const totalTrainings = await Training.countDocuments();
    const trainingsByStatus = await Training.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);
    
    const trainingsByType = await Training.aggregate([
      { $group: { _id: '$type', count: { $sum: 1 } } },
    ]);
    
    // Get upcoming trainings
    const now = new Date();
    const upcomingTrainings = await Training.countDocuments({
      startDate: { $gte: now },
      status: TrainingStatus.UPCOMING,
    });
    
    // Get total attendees in all trainings
    const totalAttendees = await Training.aggregate([
      { $unwind: "$attendees" },
      { $group: { _id: null, count: { $sum: 1 } } },
    ]);

    // Return consolidated statistics
    return NextResponse.json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          byRole: usersByRole,
          byStatus: usersByStatus,
          byCompany: usersByCompany,
        },
        documents: {
          total: totalDocuments,
          byType: documentsByType,
          byStatus: documentsByStatus,
        },
        trainings: {
          total: totalTrainings,
          upcoming: upcomingTrainings,
          byStatus: trainingsByStatus,
          byType: trainingsByType,
          totalAttendees: totalAttendees.length > 0 ? totalAttendees[0].count : 0,
        },
      },
    });
  } catch (error: any) {
    console.error('Error fetching statistics:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error fetching statistics' },
      { status: 500 }
    );
  }
} 