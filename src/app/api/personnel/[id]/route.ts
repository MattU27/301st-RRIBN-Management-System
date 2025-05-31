import { NextResponse } from 'next/server';
import { verifyJWT } from '@/utils/auth';

// This is a simple API endpoint that returns mock personnel data based on ID
// In a production app, you would connect to a database to fetch real data
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Missing or invalid authorization token' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    const decoded = await verifyJWT(token);
    if (!decoded || !['staff', 'admin', 'administrator', 'director'].includes(decoded.role)) {
      return NextResponse.json(
        { error: 'Unauthorized. Only staff, administrators and directors can view personnel profiles' },
        { status: 403 }
      );
    }

    const { id } = params;
    
    // Mock personnel data - in production, fetch from database
    const mockData = {
      id,
      name: id === 'p001' ? 'Miguel Santos' : 
            id === 'p002' ? 'Juan Dela Cruz' : 
            id === 'p003' ? 'Ana Reyes' : 
            id === 'p004' ? 'Carlo Mendoza' :
            id === 'p005' ? 'Patricia Lim' : 'Unknown Personnel',
      rank: id === 'p001' ? 'Private' : 
            id === 'p002' ? 'Private' : 
            id === 'p003' ? 'Private First Class' : 
            id === 'p004' ? 'Corporal' :
            id === 'p005' ? 'Private First Class' : 'Unknown',
      status: 'Ready',
      email: id === 'p001' ? 'miguel.santos@example.com' : 
             id === 'p002' ? 'juan.delacruz@example.com' : 
             id === 'p003' ? 'ana.reyes@example.com' : 
             id === 'p004' ? 'carlo.mendoza@example.com' :
             id === 'p005' ? 'patricia.lim@example.com' : 'unknown@example.com',
      phone: '09123456789',
      company: id === 'p001' ? 'Alpha' : 
               id === 'p002' ? 'Bravo' : 
               id === 'p003' ? 'Charlie' : 
               id === 'p004' ? 'Alpha' :
               id === 'p005' ? 'Headquarters' : 'Unknown',
      dateJoined: '2023-05-15',
      lastUpdated: '2024-03-01',
      serviceId: id === 'p001' ? 'S001' : 
                id === 'p002' ? 'S002' : 
                id === 'p003' ? 'S003' : 
                id === 'p004' ? 'S004' :
                id === 'p005' ? 'S005' : 'SXXX',
      position: 'Infantry',
      address: 'Camp General Mariano N. Castañeda, Silang, Cavite',
      dateOfBirth: '1998-07-22',
      emergencyContact: 'Family Contact: +63-9876543210',
      bloodType: 'O+',
      performanceScore: id === 'p001' ? 92 : 
                        id === 'p002' ? 88 : 
                        id === 'p003' ? 94 : 
                        id === 'p004' ? 91 :
                        id === 'p005' ? 89 : 85,
      qualifications: [
        'Basic Combat Training',
        'First Aid Certification',
        'Weapons Handling',
        'Field Operations'
      ],
      trainingCompletion: 95,
      documentsComplete: 100,
      awards: [
        {
          title: 'Excellence in Field Training',
          date: '2023-12-10',
          description: 'Awarded for outstanding performance during field training exercises.'
        },
        {
          title: 'Marksmanship Badge',
          date: '2023-09-15',
          description: 'Achieved expert level in rifle marksmanship qualification.'
        }
      ]
    };

    return NextResponse.json({ success: true, data: mockData });
  } catch (error) {
    console.error('Error in personnel API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
} 