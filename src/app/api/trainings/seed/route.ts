import { NextResponse } from 'next/server';
import { dbConnect } from '@/utils/dbConnect';
import Training, { TrainingStatus, TrainingType } from '@/models/Training';
import User from '@/models/User';
import { verifyJWT } from '@/utils/auth';
import mongoose from 'mongoose';
import AuditLog from '@/models/AuditLog';

export const dynamic = 'force-dynamic';

/**
 * POST handler to seed training data for testing
 */
export async function POST(request: Request) {
  try {
    // Connect to MongoDB
    await dbConnect();
    
    // Ensure all models are loaded
    await Promise.all([
      import('@/models/User'),
      import('@/models/Training')
    ]);
    
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
    
    // Check if user is admin
    if (decoded.role !== 'administrator' && decoded.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Only administrators can seed training data' },
        { status: 403 }
      );
    }
    
    // Find the creator user (use the authenticated user)
    const creator = await User.findById(decoded.userId);
    if (!creator) {
      return NextResponse.json(
        { success: false, error: 'Creator user not found' },
        { status: 404 }
      );
    }
    
    // Get some users for the attendees
    const users = await User.find({})
      .limit(10)
      .lean();
    
    if (users.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No users found to add as attendees' },
        { status: 404 }
      );
    }
    
    // Generate random attendees
    const getRandomAttendees = (userList: any[], count: number) => {
      const shuffled = [...userList].sort(() => 0.5 - Math.random());
      const selected = shuffled.slice(0, count);
      
      return selected.map(user => ({
        userId: user._id,
        status: Math.random() > 0.3 ? 'registered' : 'completed',
        registrationDate: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000)
      }));
    };
    
    // Current date for reference
    const now = new Date();
    
    // Sample trainings data
    const sampleTrainings = [
      {
        title: 'KAMANDAG 2023 Joint Military Exercise',
        description: 'Annual military exercise between the Armed Forces of the Philippines and the United States Marine Corps focusing on disaster response, humanitarian assistance, and counter-terrorism operations.',
        type: TrainingType.FIELD_EXERCISE,
        startDate: new Date(now.getFullYear(), now.getMonth() + 1, 10),
        endDate: new Date(now.getFullYear(), now.getMonth() + 1, 20),
        location: {
          name: 'Naval Base Subic Bay',
          address: 'Subic Bay Freeport Zone, Zambales, Philippines'
        },
        instructor: {
          name: 'Lt. Col. Jose Rizal',
          rank: 'Lieutenant Colonel',
          specialization: 'Tactical Operations',
          contactInfo: 'jrizal@mail.afp.mil.ph'
        },
        status: TrainingStatus.UPCOMING,
        capacity: 50,
        eligibleRanks: ['Captain', 'Major', 'Lieutenant Colonel', 'Colonel'],
        eligibleCompanies: ['Alpha', 'Bravo', 'Charlie'],
        mandatory: true,
        attendees: getRandomAttendees(users, 5),
        createdBy: creator._id,
        tags: ['joint exercise', 'amphibious', 'disaster response'],
        certificationOffered: true,
        certificationValidityPeriod: 24
      },
      {
        title: 'Cyber Defense and Information Security Workshop',
        description: 'Advanced training on protecting military networks, detecting intrusions, and responding to cyber threats.',
        type: TrainingType.WORKSHOP,
        startDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 5),
        endDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7),
        location: {
          name: 'AFP Communications, Electronics and Information Systems Service',
          address: 'Camp Aguinaldo, Quezon City, Metro Manila, Philippines'
        },
        instructor: {
          name: 'Maj. Maria Clara',
          rank: 'Major',
          specialization: 'Cybersecurity',
          contactInfo: 'mclara@mail.afp.mil.ph'
        },
        status: TrainingStatus.UPCOMING,
        capacity: 30,
        eligibleRanks: ['Captain', 'Major', 'Lieutenant Colonel'],
        eligibleCompanies: ['Headquarters', 'NERRSC'],
        mandatory: false,
        virtualMeetingUrl: 'https://meeting.afp.mil.ph/cyber-defense-2023',
        attendees: getRandomAttendees(users, 8),
        createdBy: creator._id,
        tags: ['cyber', 'information security', 'network defense'],
        certificationOffered: true,
        certificationValidityPeriod: 12
      },
      {
        title: 'Humanitarian Assistance and Disaster Response (HADR) Training',
        description: 'Comprehensive training on disaster response protocols, search and rescue operations, and humanitarian aid delivery during calamities.',
        type: TrainingType.FIELD_EXERCISE,
        startDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30),
        endDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 25),
        location: {
          name: 'AFP Education, Training and Doctrine Command',
          address: 'Camp Aguinaldo, Quezon City, Metro Manila, Philippines'
        },
        instructor: {
          name: 'Col. Manuel Quezon',
          rank: 'Colonel',
          specialization: 'Disaster Response',
          contactInfo: 'mquezon@mail.afp.mil.ph'
        },
        status: TrainingStatus.COMPLETED,
        capacity: 40,
        eligibleRanks: ['Private First Class', 'Corporal', 'Sergeant', 'Second Lieutenant', 'First Lieutenant'],
        eligibleCompanies: ['Alpha', 'Bravo', 'Charlie', 'Headquarters'],
        mandatory: false,
        attendees: getRandomAttendees(users, 10),
        createdBy: creator._id,
        tags: ['disaster response', 'humanitarian', 'search and rescue'],
        certificationOffered: true,
        certificationValidityPeriod: 36
      },
      {
        title: 'Combat Medic Certification Course',
        description: 'Intensive training for military personnel to provide medical support in combat scenarios, including triage, field treatments, and evacuation procedures.',
        type: TrainingType.MEDICAL,
        startDate: new Date(now.getFullYear(), now.getMonth() - 2, 15),
        endDate: new Date(now.getFullYear(), now.getMonth() - 1, 15),
        location: {
          name: 'AFP Medical Center (V. Luna General Hospital)',
          address: 'V. Luna Road, Quezon City, Metro Manila, Philippines'
        },
        instructor: {
          name: 'Maj. Rosa Alvarez',
          rank: 'Major',
          specialization: 'Combat Medicine',
          contactInfo: 'ralvarez@mail.afp.mil.ph'
        },
        status: TrainingStatus.COMPLETED,
        capacity: 25,
        eligibleRanks: ['Private', 'Private First Class', 'Corporal', 'Sergeant'],
        eligibleCompanies: ['Alpha', 'Bravo', 'Charlie'],
        mandatory: false,
        attendees: getRandomAttendees(users, 6),
        createdBy: creator._id,
        tags: ['medical', 'combat', 'first aid', 'triage'],
        certificationOffered: true,
        certificationValidityPeriod: 24
      },
      {
        title: 'Leadership and Strategic Management Seminar',
        description: 'Advanced leadership training for senior officers focusing on strategic planning, organizational management, and effective decision making.',
        type: TrainingType.SEMINAR,
        startDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 15),
        endDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 17),
        location: {
          name: 'AFP Officers Club',
          address: 'Camp General Emilio Aguinaldo, Quezon City, Metro Manila, Philippines'
        },
        instructor: {
          name: 'Gen. Antonio Luna',
          rank: 'General',
          specialization: 'Leadership and Strategy',
          contactInfo: 'aluna@mail.afp.mil.ph'
        },
        status: TrainingStatus.UPCOMING,
        capacity: 20,
        eligibleRanks: ['Major', 'Lieutenant Colonel', 'Colonel', 'Brigadier General'],
        eligibleCompanies: ['Headquarters'],
        mandatory: false,
        attendees: getRandomAttendees(users, 4),
        createdBy: creator._id,
        tags: ['leadership', 'strategic planning', 'management'],
        certificationOffered: false
      }
    ];
    
    // Insert the sample data
    await Training.deleteMany({}); // Clear existing data
    await Training.insertMany(sampleTrainings);
    
    // Create audit log entry
    try {
      const auditLog = new AuditLog({
        timestamp: new Date(),
        userId: decoded.userId,
        userName: `${creator.firstName} ${creator.lastName}`,
        userRole: creator.role,
        action: 'create',
        resource: 'training',
        details: `Created ${sampleTrainings.length} sample training records`,
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      });
      
      await auditLog.save();
      console.log('Training seed operation logged to audit system');
    } catch (auditError) {
      // Don't fail the main operation if audit logging fails
      console.error('Error logging to audit system:', auditError);
    }
    
    return NextResponse.json({
      success: true,
      message: `Successfully created ${sampleTrainings.length} sample trainings`,
      count: sampleTrainings.length
    });
  } catch (error: any) {
    console.error('Error seeding training data:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error seeding training data' },
      { status: 500 }
    );
  }
} 