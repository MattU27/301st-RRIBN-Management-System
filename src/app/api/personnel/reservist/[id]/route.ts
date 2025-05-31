import { NextResponse } from 'next/server';
import { dbConnect } from '@/utils/dbConnect';
import mongoose from 'mongoose';
import { getToken } from 'next-auth/jwt';
import RIDS from '@/models/RIDS';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    
    // Extract the reservist ID from the URL params
    const reservistId = params.id;
    
    if (!reservistId) {
      return NextResponse.json(
        { success: false, error: 'Reservist ID is required' },
        { status: 400 }
      );
    }
    
    if (!mongoose.connection.db) {
      return NextResponse.json(
        { success: false, error: 'Database connection not established' },
        { status: 500 }
      );
    }
    
    const db = mongoose.connection.db;
    
    // Get user collection and find the reservist
    const usersCollection = db.collection('users');
    
    // Try to find the user by the provided ID
    let reservist;
    
    try {
      // First try as ObjectId
      const objectId = new mongoose.Types.ObjectId(reservistId);
      reservist = await usersCollection.findOne({ _id: objectId });
    } catch (e) {
      // If that fails, try as a string ID
      reservist = await usersCollection.findOne({ id: reservistId });
    }
    
    if (!reservist) {
      return NextResponse.json(
        { success: false, error: 'Reservist not found' },
        { status: 404 }
      );
    }
    
    // Get RIDS data if it exists
    const ridsCollection = db.collection('rids');
    let ridsData = null;
    
    // Try to find RIDS by userId
    ridsData = await ridsCollection.findOne({ userId: reservist._id });
    
    // If no RIDS found by userId, try by serviceId
    if (!ridsData && reservist.serviceId) {
      ridsData = await ridsCollection.findOne({ 
        "identificationInfo.serviceId": reservist.serviceId 
      });
    }
    
    // Format the response
    const formattedReservist = {
      id: reservist._id.toString(),
      name: `${reservist.firstName || ''} ${reservist.lastName || ''}`.trim() || 'Pending Registration',
      rank: reservist.rank || 'N/A',
      serviceNumber: reservist.serviceId || 'N/A',
      email: reservist.email || 'N/A',
      status: reservist.status || 'pending',
      company: reservist.company || 'N/A',
      dateJoined: reservist.createdAt ? new Date(reservist.createdAt).toISOString().split('T')[0] : 'N/A',
      lastUpdated: reservist.updatedAt ? new Date(reservist.updatedAt).toISOString().split('T')[0] : 'N/A',
      ridsStatus: reservist.ridsStatus || 'incomplete',
      isRegistrationComplete: reservist.isRegistrationComplete || false,
      ridsData: ridsData ? {
        personalInformation: ridsData.personalInformation || {
          fullName: 'Pending Registration',
          dateOfBirth: 'N/A',
          placeOfBirth: 'N/A',
          gender: 'N/A',
          civilStatus: 'N/A',
          religion: 'N/A',
          citizenship: 'N/A',
          bloodType: 'N/A'
        },
        contactInformation: ridsData.contactInformation || {
          residentialAddress: 'N/A',
          mobileNumber: 'N/A',
          emailAddress: reservist.email || 'N/A'
        },
        identificationInfo: ridsData.identificationInfo || {
          serviceId: reservist.serviceId || 'N/A',
          height: 'N/A',
          weight: 'N/A'
        },
        educationalBackground: ridsData.educationalBackground || {
          highestEducation: 'N/A',
          school: 'N/A',
          yearGraduated: 'N/A'
        },
        occupationInfo: ridsData.occupationInfo || {
          occupation: 'N/A'
        },
        militaryTraining: ridsData.militaryTraining || [],
        specialSkills: ridsData.specialSkills || [],
        awards: ridsData.awards || [],
        assignments: ridsData.assignments || [],
        filePath: ridsData.filePath || null
      } : null
    };
    
    // If the reservist has embedded ridsData, use that
    if (reservist.ridsData && !formattedReservist.ridsData) {
      formattedReservist.ridsData = reservist.ridsData;
    }
    
    return NextResponse.json({
      success: true,
      data: {
        reservist: formattedReservist
      }
    });
    
  } catch (error: any) {
    console.error('Error fetching reservist:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to fetch reservist'
      },
      { status: 500 }
    );
  }
} 