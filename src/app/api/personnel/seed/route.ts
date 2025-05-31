import { NextResponse } from 'next/server';
import { dbConnect } from '@/utils/dbConnect';
import Personnel from '@/models/Personnel';
import { verifyJWT } from '@/utils/auth';

const FILIPINO_PERSONNEL = [
  {
    name: 'Ricardo Santos Dela Cruz',
    rank: 'Colonel',
    company: 'Headquarters',
    status: 'active',
    email: 'rsdelacruz@afppms.mil',
    phoneNumber: '+63 915 789 1234',
    dateJoined: new Date('2005-06-15'),
    role: 'admin',
    serviceNumber: 'AFP-123456',
    specialization: ['Strategic Planning', 'Intelligence'],
    address: {
      street: '123 Mabini Street',
      city: 'Quezon City',
      province: 'Metro Manila',
      postalCode: '1100'
    },
    emergencyContact: {
      name: 'Maria Dela Cruz',
      relationship: 'Spouse',
      contactNumber: '+63 917 456 7890'
    }
  },
  {
    name: 'Maria Luisa Reyes',
    rank: 'Major',
    company: 'Alpha',
    status: 'active',
    email: 'mlreyes@afppms.mil',
    phoneNumber: '+63 918 234 5678',
    dateJoined: new Date('2010-03-22'),
    role: 'staff',
    serviceNumber: 'AFP-234567',
    specialization: ['Logistics', 'Operations Planning'],
    address: {
      street: '456 Rizal Avenue',
      city: 'Makati City',
      province: 'Metro Manila',
      postalCode: '1200'
    },
    emergencyContact: {
      name: 'Jose Reyes',
      relationship: 'Father',
      contactNumber: '+63 919 567 8901'
    }
  },
  {
    name: 'Antonio Magsaysay',
    rank: 'Lieutenant Colonel',
    company: 'Bravo',
    status: 'active',
    email: 'amagsaysay@afppms.mil',
    phoneNumber: '+63 920 345 6789',
    dateJoined: new Date('2007-11-10'),
    role: 'staff',
    serviceNumber: 'AFP-345678',
    specialization: ['Tactics', 'Training'],
    address: {
      street: '789 Luna Street',
      city: 'Taguig City',
      province: 'Metro Manila',
      postalCode: '1630'
    },
    emergencyContact: {
      name: 'Elena Magsaysay',
      relationship: 'Spouse',
      contactNumber: '+63 921 678 9012'
    }
  },
  {
    name: 'Sofia Dimaculangan',
    rank: 'Second Lieutenant',
    company: 'Charlie',
    status: 'standby',
    email: 'sdimaculangan@afppms.mil',
    phoneNumber: '+63 922 456 7890',
    dateJoined: new Date('2020-01-05'),
    role: 'reservist',
    serviceNumber: 'AFP-456789',
    specialization: ['Communications', 'Cybersecurity'],
    address: {
      street: '234 Bonifacio Street',
      city: 'Pasig City',
      province: 'Metro Manila',
      postalCode: '1600'
    },
    emergencyContact: {
      name: 'Roberto Dimaculangan',
      relationship: 'Brother',
      contactNumber: '+63 923 789 0123'
    }
  },
  {
    name: 'Josefino Tolentino',
    rank: 'Staff Sergeant',
    company: 'NERRSC (NERR-Signal Company)',
    status: 'ready',
    email: 'jtolentino@afppms.mil',
    phoneNumber: '+63 924 567 8901',
    dateJoined: new Date('2015-07-18'),
    role: 'enlisted',
    serviceNumber: 'AFP-567890',
    specialization: ['Signal Operations', 'Electronics'],
    address: {
      street: '567 Aguinaldo Avenue',
      city: 'Cavite City',
      province: 'Cavite',
      postalCode: '4100'
    },
    emergencyContact: {
      name: 'Clara Tolentino',
      relationship: 'Mother',
      contactNumber: '+63 925 890 1234'
    }
  },
  {
    name: 'Eduardo Magbanua',
    rank: 'Master Sergeant',
    company: 'NERRFAB (NERR-Field Artillery Battery)',
    status: 'ready',
    email: 'emagbanua@afppms.mil',
    phoneNumber: '+63 926 678 9012',
    dateJoined: new Date('2008-09-30'),
    role: 'enlisted',
    serviceNumber: 'AFP-678901',
    specialization: ['Artillery Systems', 'Weapons Training'],
    address: {
      street: '890 Del Pilar Street',
      city: 'Bacoor',
      province: 'Cavite',
      postalCode: '4102'
    },
    emergencyContact: {
      name: 'Angelica Magbanua',
      relationship: 'Spouse',
      contactNumber: '+63 927 901 2345'
    }
  },
  {
    name: 'Jericho Mendoza',
    rank: 'Captain',
    company: 'Alpha',
    status: 'active',
    email: 'jmendoza@afppms.mil',
    phoneNumber: '+63 928 789 0123',
    dateJoined: new Date('2012-05-14'),
    role: 'staff',
    serviceNumber: 'AFP-789012',
    specialization: ['Infantry Tactics', 'Close Quarters Combat'],
    address: {
      street: '123 Magsaysay Blvd',
      city: 'Manila',
      province: 'Metro Manila',
      postalCode: '1000'
    },
    emergencyContact: {
      name: 'Isabel Mendoza',
      relationship: 'Spouse',
      contactNumber: '+63 929 012 3456'
    }
  },
  {
    name: 'Gloria Esperanza',
    rank: 'First Lieutenant',
    company: 'NERRSC (NERR-Signal Company)',
    status: 'active',
    email: 'gesperanza@afppms.mil',
    phoneNumber: '+63 930 890 1234',
    dateJoined: new Date('2018-12-03'),
    role: 'staff',
    serviceNumber: 'AFP-890123',
    specialization: ['Satellite Communications', 'Network Security'],
    address: {
      street: '456 Commonwealth Avenue',
      city: 'Quezon City',
      province: 'Metro Manila',
      postalCode: '1121'
    },
    emergencyContact: {
      name: 'Manuel Esperanza',
      relationship: 'Father',
      contactNumber: '+63 931 123 4567'
    }
  },
  {
    name: 'Rafael Bautista',
    rank: 'Technical Sergeant',
    company: 'Bravo',
    status: 'standby',
    email: 'rbautista@afppms.mil',
    phoneNumber: '+63 932 901 2345',
    dateJoined: new Date('2014-08-22'),
    role: 'enlisted',
    serviceNumber: 'AFP-901234',
    specialization: ['Mechanical Maintenance', 'Vehicle Operations'],
    address: {
      street: '789 Aurora Blvd',
      city: 'Antipolo',
      province: 'Rizal',
      postalCode: '1870'
    },
    emergencyContact: {
      name: 'Teresa Bautista',
      relationship: 'Mother',
      contactNumber: '+63 933 234 5678'
    }
  },
  {
    name: 'Margarita Dizon',
    rank: 'Major',
    company: 'Headquarters',
    status: 'active',
    email: 'mdizon@afppms.mil',
    phoneNumber: '+63 934 012 3456',
    dateJoined: new Date('2009-04-17'),
    role: 'admin',
    serviceNumber: 'AFP-012345',
    specialization: ['Personnel Management', 'Administration'],
    address: {
      street: '234 EDSA',
      city: 'Mandaluyong City',
      province: 'Metro Manila',
      postalCode: '1550'
    },
    emergencyContact: {
      name: 'Roberto Dizon',
      relationship: 'Spouse',
      contactNumber: '+63 935 345 6789'
    }
  },
  {
    name: 'Benjamin Cruz',
    rank: 'Brigadier General',
    company: 'Headquarters',
    status: 'active',
    email: 'bcruz@afppms.mil',
    phoneNumber: '+63 936 123 4567',
    dateJoined: new Date('2000-01-10'),
    role: 'director',
    serviceNumber: 'AFP-123789',
    specialization: ['Strategic Command', 'Military Operations'],
    address: {
      street: '567 Burgos Street',
      city: 'San Juan',
      province: 'Metro Manila',
      postalCode: '1500'
    },
    emergencyContact: {
      name: 'Patricia Cruz',
      relationship: 'Spouse',
      contactNumber: '+63 937 456 7890'
    }
  },
  {
    name: 'Ferdinand Aquino',
    rank: 'Sergeant',
    company: 'NERRFAB (NERR-Field Artillery Battery)',
    status: 'ready',
    email: 'faquino@afppms.mil',
    phoneNumber: '+63 938 234 5678',
    dateJoined: new Date('2016-06-25'),
    role: 'enlisted',
    serviceNumber: 'AFP-234890',
    specialization: ['Artillery Operations', 'Field Tactics'],
    address: {
      street: '890 Shaw Blvd',
      city: 'Pasig City',
      province: 'Metro Manila',
      postalCode: '1600'
    },
    emergencyContact: {
      name: 'Josephine Aquino',
      relationship: 'Spouse',
      contactNumber: '+63 939 567 8901'
    }
  }
];

export async function POST(request: Request) {
  try {
    // Connect to MongoDB
    await dbConnect();
    
    // Verify the token to ensure only authorized users can seed data
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const token = authHeader.split(' ')[1];
    const decodedToken = await verifyJWT(token);
    
    // Only allow admins and directors to seed data
    if (!decodedToken || (decodedToken.role !== 'admin' && decodedToken.role !== 'director')) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions to seed data' },
        { status: 403 }
      );
    }
    
    // Get request body to check if we should clear existing data
    const body = await request.json();
    const shouldClearExisting = body?.clearExisting === true;
    
    // Clear existing personnel if requested
    if (shouldClearExisting) {
      await Personnel.deleteMany({});
    }
    
    // Insert the Filipino personnel data
    const result = await Personnel.insertMany(FILIPINO_PERSONNEL);
    
    return NextResponse.json({
      success: true,
      message: `Successfully seeded ${result.length} personnel records`,
      data: {
        count: result.length,
        cleared: shouldClearExisting
      }
    });
  } catch (error: any) {
    console.error('Error seeding personnel data:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to seed personnel data' },
      { status: 500 }
    );
  }
} 