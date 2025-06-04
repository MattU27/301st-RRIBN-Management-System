// Script to schedule automatic fixing of documents
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

// Path to the auto-fix-documents.js script
const scriptPath = path.join(__dirname, 'auto-fix-documents.js');

// Function to run the script and log the output
function runFixScript() {
  console.log(`Running document fix script at ${new Date().toISOString()}`);
  
  // Create logs directory if it doesn't exist
  const logsDir = path.join(__dirname, 'logs');
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir);
  }
  
  // Log file path
  const logFile = path.join(logsDir, `document-fix-${new Date().toISOString().replace(/:/g, '-')}.log`);
  
  // Execute the script
  exec(`node ${scriptPath}`, (error, stdout, stderr) => {
    // Log the output
    const output = `
=== Document Fix Script Run ===
Time: ${new Date().toISOString()}
${error ? `Error: ${error.message}` : ''}
=== Standard Output ===
${stdout}
=== Standard Error ===
${stderr}
=== End of Log ===
`;
    
    // Write to log file
    fs.writeFileSync(logFile, output);
    
    if (error) {
      console.error(`Error running script: ${error.message}`);
      return;
    }
    
    console.log(`Script completed successfully. Log saved to ${logFile}`);
  });
}

// Run immediately
runFixScript();

// Schedule to run every hour
const ONE_HOUR = 60 * 60 * 1000;
setInterval(runFixScript, ONE_HOUR);

console.log('Document fix scheduler started. Will run every hour.');
console.log('Press Ctrl+C to stop.'); 