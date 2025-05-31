import { execSync } from 'child_process';
import path from 'path';
import { config } from 'dotenv';

// Load environment variables
config();

// Function to run a script and log its output
function runScript(scriptPath: string): void {
  console.log(`\n========== Running ${path.basename(scriptPath)} ==========\n`);
  
  try {
    // Execute the TypeScript script using ts-node
    const output = execSync(`npx ts-node ${scriptPath}`, { 
      encoding: 'utf-8',
      stdio: 'inherit'
    });
    
    console.log(`\n========== ${path.basename(scriptPath)} completed successfully ==========\n`);
  } catch (error) {
    console.error(`Error running ${path.basename(scriptPath)}:`, error);
    process.exit(1);
  }
}

// Main function to run all seed scripts
async function seedDatabase() {
  console.log('===== Starting Database Seeding Process =====');
  
  // Define the paths to our seed scripts
  const companyScriptPath = path.join(__dirname, 'seedCompanies.ts');
  const personnelScriptPath = path.join(__dirname, 'seedPersonnel.ts');
  
  // Run the company seed script first
  console.log('Step 1: Seeding companies...');
  runScript(companyScriptPath);
  
  // Then run the personnel seed script
  console.log('Step 2: Seeding personnel...');
  runScript(personnelScriptPath);
  
  console.log('===== Database Seeding Process Completed Successfully =====');
}

// Run the seeding process
seedDatabase().catch(err => {
  console.error('Error in seedDatabase:', err);
  process.exit(1);
}); 