
/** @type {import('next').NextConfig} */
const fs = require('fs');
const path = require('path');

// Create upload directories if they don't exist
const ensureUploadDirectories = () => {
  try {
    const publicDir = path.join(process.cwd(), 'public');
    const uploadsDir = path.join(publicDir, 'uploads');
    const ridsDir = path.join(uploadsDir, 'rids');
    
    if (!fs.existsSync(publicDir)) {
      console.log('Creating public directory');
      fs.mkdirSync(publicDir, { recursive: true });
    }
    
    if (!fs.existsSync(uploadsDir)) {
      console.log('Creating uploads directory');
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    
    if (!fs.existsSync(ridsDir)) {
      console.log('Creating RIDS directory');
      fs.mkdirSync(ridsDir, { recursive: true });
    }
    
    // Create a test file to verify write access
    const testFile = path.join(ridsDir, 'directory-test.txt');
    fs.writeFileSync(testFile, 'RIDS upload directory test file. Safe to delete.');
    console.log('Upload directories created successfully');
  } catch (error) {
    console.error('Error creating upload directories:', error);
    console.error('This may cause file uploads to fail!');
  }
};

// Run the directory creation
ensureUploadDirectories();

const nextConfig = {
  reactStrictMode: false,
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    domains: ['i.imgur.com', 'placehold.co'],
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.externals = [...(config.externals || []), { ws: 'ws' }];
    }
    return config;
  }
};

module.exports = nextConfig;
