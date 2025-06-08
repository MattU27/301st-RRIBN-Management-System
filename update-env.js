const fs = require('fs');
const path = require('path');

// Create or update .env.production file
const envPath = path.join(__dirname, '.env.production');

const envContent = `
# MongoDB Connection - Use the same as in your regular .env
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.wt06z4x.mongodb.net/afp_personnel_db?retryWrites=true&w=majority&appName=Cluster0

# JWT Secret for Authentication
JWT_SECRET=use-a-strong-secret-key-here-for-jwt-signing

# Application Environment
NODE_ENV=production

# Port Configuration
PORT=3000

# -----------------------------------------------
# EMAIL CONFIGURATION FOR PRODUCTION
# -----------------------------------------------
# Using Gmail (update with your actual credentials)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=sasukebanto@gmail.com
EMAIL_PASS=
EMAIL_FROM=301st RRIBN <noreply@armed-forces.com>

# The base URL for links in emails
NEXT_PUBLIC_BASE_URL=http://localhost:3000
`;

try {
  fs.writeFileSync(envPath, envContent);
  console.log('Created .env.production file');
  
  // Notify user to update credentials
  console.log('\nIMPORTANT: You need to update the actual email credentials in .env.production file:');
  console.log('1. Open .env.production');
  console.log('2. Update EMAIL_USER with your Gmail address');
  console.log('3. Update EMAIL_PASS with your Gmail app password');
  console.log('4. Update MONGODB_URI with your actual MongoDB connection string');
  console.log('5. Update NEXT_PUBLIC_BASE_URL with your actual domain if deployed\n');
  
  // Also copy to .env.local which has higher precedence
  fs.copyFileSync(envPath, path.join(__dirname, '.env.local'));
  console.log('Created .env.local file (takes precedence over .env)');
  
} catch (error) {
  console.error('Error creating environment files:', error);
} 