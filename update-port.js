const fs = require('fs');
const path = require('path');

// List of env files to update
const envFiles = ['.env', '.env.local', '.env.production'];

// Function to update port in a file
function updatePortInFile(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      console.log(`Updating port in ${filePath}...`);
      
      // Read the file content
      let content = fs.readFileSync(filePath, 'utf8');
      
      // Replace PORT=10000 with PORT=3000
      content = content.replace(/PORT=10000/g, 'PORT=3000');
      
      // Replace NEXT_PUBLIC_BASE_URL=http://localhost:10000 with NEXT_PUBLIC_BASE_URL=http://localhost:3000
      content = content.replace(/NEXT_PUBLIC_BASE_URL=http:\/\/localhost:10000/g, 'NEXT_PUBLIC_BASE_URL=http://localhost:3000');
      
      // Write the updated content back to the file
      fs.writeFileSync(filePath, content);
      console.log(`Updated ${filePath} successfully.`);
    } else {
      console.log(`File ${filePath} does not exist, skipping.`);
    }
  } catch (error) {
    console.error(`Error updating ${filePath}:`, error);
  }
}

// Process each env file
envFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  updatePortInFile(filePath);
});

console.log('\nPort updated to 3000 in all environment files.');
console.log('Please restart the server for changes to take effect.'); 