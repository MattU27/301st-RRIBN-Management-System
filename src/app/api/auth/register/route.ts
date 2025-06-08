import { NextResponse } from 'next/server';
import { dbConnect } from '@/utils/dbConnect';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { sendRegistrationConfirmationEmail } from '@/services/emailService';

export async function POST(request: Request) {
  try {
    // Connect to MongoDB
    await dbConnect();
    
    // Get registration data from request body
    const data = await request.json();
    
    // Validate required fields
    const requiredFields = ['firstName', 'lastName', 'email', 'password', 'role', 'serviceId'];
    for (const field of requiredFields) {
      if (!data[field]) {
        return NextResponse.json(
          { success: false, error: `${field} is required` },
          { status: 400 }
        );
      }
    }
    
    // Check if email already exists
    const userCollection = await mongoose.connection.collection('users');
    const existingUser = await userCollection.findOne({ email: data.email });
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'Email already registered' },
        { status: 400 }
      );
    }
    
    // Check if Service ID already exists
    const existingServiceId = await userCollection.findOne({ serviceId: data.serviceId });
    if (existingServiceId) {
      // For reservist role, check if the Service ID is eligible for registration
      if (data.role === 'reservist') {
        if (!existingServiceId.canRegister) {
          return NextResponse.json(
            { success: false, error: 'This Service ID is not eligible for registration. Please contact your unit staff.' },
            { status: 400 }
          );
        } else {
          // Check if registration has already been completed
          if (existingServiceId.isRegistrationComplete) {
            return NextResponse.json(
              { success: false, error: 'Registration has already been completed for this Service ID.' },
              { status: 400 }
            );
          }
          
          // Service ID exists and is eligible for registration
          // We will update this account instead of creating a new one
          try {
            // Hash the password
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(data.password, salt);
            
            // Update the existing account with the provided information
            const updateResult = await userCollection.updateOne(
              { serviceId: data.serviceId },
              { 
                $set: {
                  firstName: data.firstName,
                  lastName: data.lastName,
                  email: data.email.toLowerCase(),
                  alternativeEmail: data.alternativeEmail ? data.alternativeEmail.toLowerCase() : null,
                  password: hashedPassword,
                  status: 'active', // Activate the account since it was pre-approved by staff
                  isRegistrationComplete: true,
                  updatedAt: new Date(),
                }
              }
            );
            
            if (!updateResult.acknowledged) {
              throw new Error('Failed to update user account');
            }
            
            // Send confirmation emails
            await sendRegistrationConfirmationEmail(
              data.email.toLowerCase(),
              data.firstName,
              data.lastName
            );
            
            // Send to alternative email if provided
            if (data.alternativeEmail) {
              await sendRegistrationConfirmationEmail(
                data.alternativeEmail.toLowerCase(),
                data.firstName,
                data.lastName
              );
            }
            
            // Return success response
            return NextResponse.json({
              success: true,
              message: 'Registration successful. Your account has been activated.',
              data: {
                email: data.email.toLowerCase(),
                role: 'reservist',
                status: 'active',
              },
            });
          } catch (updateError: any) {
            console.error('Error updating user:', updateError);
            return NextResponse.json(
              { success: false, error: updateError.message || 'Registration failed' },
              { status: 500 }
            );
          }
        }
      } else {
        // For non-reservist roles, just return the error as before
        return NextResponse.json(
          { success: false, error: 'Service ID already registered' },
          { status: 400 }
        );
      }
    }
    
    // For reservist role, verify that the Service ID has been pre-uploaded by staff
    if (data.role === 'reservist') {
      // Service ID should already exist with canRegister set to true
      return NextResponse.json(
        { success: false, error: 'Your RIDS has not been uploaded to the system. Please contact your unit administrator to verify your Service ID before registration.' },
        { status: 400 }
      );
    }
    
    // Validate role
    const validRoles = ['staff', 'administrator', 'director', 'reservist', 'enlisted'];
    if (!validRoles.includes(data.role)) {
      return NextResponse.json(
        { success: false, error: `Invalid role: '${data.role}'. Valid roles are: ${validRoles.join(', ')}` },
        { status: 400 }
      );
    }
    
    // Validate company if provided
    if (data.company) {
      const validCompanies = [
        'Alpha', 
        'Bravo', 
        'Charlie', 
        'Headquarters', 
        'NERRSC', 
        'NERRFAB',
        'NERRSC (NERR-Signal Company)',
        'NERRFAB (NERR-Field Artillery Battery)'
      ];
      if (!validCompanies.includes(data.company)) {
        return NextResponse.json(
          { success: false, error: `Invalid company: '${data.company}'. Valid companies are: ${validCompanies.join(', ')}` },
          { status: 400 }
        );
      }
    }
    
    // Check if rank is provided for reservist and enlisted roles
    if (['reservist', 'enlisted'].includes(data.role) && !data.rank) {
      return NextResponse.json(
        { success: false, error: 'Rank is required for reservist and enlisted roles' },
        { status: 400 }
      );
    }
    
    // Create new user (only for non-reservist roles at this point)
    console.log('Creating new user with data:', {
      ...data,
      password: '[REDACTED]' // Don't log the password
    });
    
    try {
      // Hash the password manually instead of relying on the middleware
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(data.password, salt);
      
      // Use insertOne directly to bypass schema validation
      const userData = {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email.toLowerCase(),
        alternativeEmail: data.alternativeEmail ? data.alternativeEmail.toLowerCase() : null,
        password: hashedPassword,
        role: data.role,
        company: data.company || null,
        rank: data.rank || null,
        serviceId: data.serviceId,
        status: 'pending',
        specializations: data.specializations || [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      console.log('Inserting user with role:', userData.role);
      console.log('Inserting user with company:', userData.company);
      
      const result = await userCollection.insertOne(userData);
      
      if (!result.acknowledged) {
        throw new Error('Failed to insert user into database');
      }
      
      // Send confirmation emails
      await sendRegistrationConfirmationEmail(
        userData.email,
        userData.firstName,
        userData.lastName
      );
      
      // Send to alternative email if provided
      if (userData.alternativeEmail) {
        await sendRegistrationConfirmationEmail(
          userData.alternativeEmail,
          userData.firstName,
          userData.lastName
        );
      }
      
      // Return success response
      return NextResponse.json({
        success: true,
        message: 'Registration successful. Confirmation emails have been sent.',
        data: {
          email: userData.email,
          role: userData.role,
          status: userData.status,
        },
      });
    } catch (saveError: any) {
      console.error('Error saving user:', saveError);
      console.error('Error name:', saveError.name);
      console.error('Full error object:', JSON.stringify(saveError, null, 2));
      
      // Provide more detailed validation error messages
      if (saveError.name === 'ValidationError') {
        const validationErrors: string[] = [];
        
        // Extract all validation error messages
        for (const field in saveError.errors) {
          const errorMsg = saveError.errors[field].message;
          validationErrors.push(errorMsg);
          console.error(`Validation error for field ${field}:`, errorMsg);
        }
        
        return NextResponse.json(
          { 
            success: false, 
            error: 'User validation failed', 
            validationErrors
          },
          { status: 400 }
        );
      }
      
      // Handle duplicate key errors
      if (saveError.code === 11000) {
        const field = Object.keys(saveError.keyPattern)[0];
        return NextResponse.json(
          { success: false, error: `${field} already exists` },
          { status: 400 }
        );
      }
      
      throw saveError; // Re-throw for the outer catch block
    }
  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Registration failed' },
      { status: 500 }
    );
  }
} 