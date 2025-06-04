// Script to run both the fix and seed scripts
const { exec } = require('child_process');
const path = require('path');

// Function to run a script and return a promise
function runScript(scriptPath) {
  return new Promise((resolve, reject) => {
    console.log(`Running script: ${scriptPath}`);
    
    const process = exec(`node ${scriptPath}`, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error executing script: ${error}`);
        reject(error);
        return;
      }
      
      if (stderr) {
        console.error(`Script stderr: ${stderr}`);
      }
      
      console.log(`Script stdout: ${stdout}`);
      resolve();
    });
    
    // Forward script output to console in real-time
    process.stdout.on('data', (data) => {
      console.log(data.toString().trim());
    });
    
    process.stderr.on('data', (data) => {
      console.error(data.toString().trim());
    });
  });
}

// Main function to run all scripts
async function runAllScripts() {
  try {
    // Get the directory of the current script
    const scriptsDir = __dirname;
    
    // Define scripts to run in order
    const scripts = [
      path.join(scriptsDir, 'fix-documents.js'),
      path.join(scriptsDir, 'seed-documents.js')
    ];
    
    // Run each script sequentially
    for (const script of scripts) {
      await runScript(script);
    }
    
    console.log('All scripts completed successfully');
  } catch (error) {
    console.error('Error running scripts:', error);
    process.exit(1);
  }
}

// Run the main function
runAllScripts(); 