// Script to generate a valid bcrypt hash
const bcrypt = require('bcryptjs');

async function generateHash() {
  const password = 'password123';
  
  // Generate salt
  const salt = await bcrypt.genSalt(10);
  
  // Hash password
  const hash = await bcrypt.hash(password, salt);
  
  console.log('Generated hash for "password123":', hash);
  
  // Verify the hash
  const isValid = await bcrypt.compare(password, hash);
  console.log('Is hash valid:', isValid);
  
  return hash;
}

generateHash()
  .then(hash => {
    console.log('Final hash to use in addDemoAccounts.js:', hash);
  })
  .catch(console.error); 