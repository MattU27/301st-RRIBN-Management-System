import { NextResponse } from 'next/server';
import { mkdir } from 'fs/promises';
import path from 'path';
import fs from 'fs';

export async function GET() {
  try {
    const publicDir = path.join(process.cwd(), 'public');
    const uploadsDir = path.join(publicDir, 'uploads');
    const ridsDir = path.join(uploadsDir, 'rids');
    
    const directoryStatus = {
      publicDir: fs.existsSync(publicDir),
      uploadsDir: fs.existsSync(uploadsDir),
      ridsDir: fs.existsSync(ridsDir),
      created: {
        publicDir: false,
        uploadsDir: false,
        ridsDir: false
      }
    };
    
    // Create each directory if it doesn't exist
    if (!directoryStatus.publicDir) {
      await mkdir(publicDir, { recursive: true });
      directoryStatus.created.publicDir = true;
    }
    
    if (!directoryStatus.uploadsDir) {
      await mkdir(uploadsDir, { recursive: true });
      directoryStatus.created.uploadsDir = true;
    }
    
    if (!directoryStatus.ridsDir) {
      await mkdir(ridsDir, { recursive: true });
      directoryStatus.created.ridsDir = true;
    }
    
    // Check again after creation
    directoryStatus.publicDir = fs.existsSync(publicDir);
    directoryStatus.uploadsDir = fs.existsSync(uploadsDir);
    directoryStatus.ridsDir = fs.existsSync(ridsDir);
    
    // Create a test file to check write permissions
    let canWrite = false;
    const testFilePath = path.join(ridsDir, 'test-write.txt');
    try {
      fs.writeFileSync(testFilePath, 'Test write permissions');
      fs.unlinkSync(testFilePath); // Delete the test file
      canWrite = true;
    } catch (error) {
      console.error('Error testing write permissions:', error);
    }
    
    return NextResponse.json({
      success: true,
      message: 'Directory check completed',
      directoryStatus,
      paths: {
        publicDir,
        uploadsDir,
        ridsDir
      },
      canWrite
    });
  } catch (error: any) {
    console.error('Error checking directories:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error checking directories' },
      { status: 500 }
    );
  }
} 