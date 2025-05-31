#!/usr/bin/env node

/**
 * Script to run TypeScript seeding files
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Get the path to ts-node in node_modules
function findTsNodePath() {
  const rootDir = path.resolve(__dirname, '../..');
  const possiblePaths = [
    path.join(rootDir, 'node_modules', '.bin', 'ts-node'),
    path.join(rootDir, 'node_modules', '.bin', 'ts-node.cmd'), // Windows
  ];

  for (const tsNodePath of possiblePaths) {
    if (fs.existsSync(tsNodePath)) {
      return tsNodePath;
    }
  }

  // If not found in local node_modules, try global
  return 'ts-node';
}

// Run a TypeScript file using ts-node
function runTsFile(tsFile) {
  return new Promise((resolve, reject) => {
    const tsNodePath = findTsNodePath();
    const fullPath = path.resolve(__dirname, tsFile);
    
    console.log(`\n========== Running ${path.basename(tsFile)} ==========\n`);
    console.log(`Using ts-node: ${tsNodePath}`);
    console.log(`Script path: ${fullPath}`);
    
    // Create the process using spawn with the correct escaping for Windows paths
    // Don't use shell: true on Windows to avoid path issues with spaces
    const isWindows = process.platform === 'win32';
    
    const childProcess = spawn(
      isWindows ? tsNodePath : 'node',
      isWindows ? [fullPath] : [tsNodePath, fullPath],
      {
        stdio: 'inherit',
        shell: !isWindows // Don't use shell on Windows
      }
    );

    childProcess.on('close', (code) => {
      if (code === 0) {
        console.log(`\n========== ${path.basename(tsFile)} completed successfully ==========\n`);
        resolve();
      } else {
        console.error(`\n========== ${path.basename(tsFile)} failed with code ${code} ==========\n`);
        reject(new Error(`Process exited with code ${code}`));
      }
    });
  });
}

// Get script to run based on command line argument
function getScriptsToRun() {
  const arg = process.argv[2];
  
  if (!arg) {
    // No argument, run all scripts in sequence
    return ['seedCompanies.ts', 'seedPersonnel.ts'];
  }
  
  switch (arg.toLowerCase()) {
    case 'companies':
      return ['seedCompanies.ts'];
    case 'personnel':
      return ['seedPersonnel.ts'];
    case 'all':
      return ['seedCompanies.ts', 'seedPersonnel.ts'];
    default:
      console.error(`Unknown script: ${arg}`);
      console.log('Available options: companies, personnel, all');
      process.exit(1);
  }
}

// Run the scripts
async function runScripts() {
  try {
    console.log('===== Starting Database Seeding Process =====');
    
    const scriptsToRun = getScriptsToRun();
    
    for (let i = 0; i < scriptsToRun.length; i++) {
      const script = scriptsToRun[i];
      console.log(`Step ${i + 1}: Running ${script}...`);
      await runTsFile(script);
    }
    
    console.log('===== Database Seeding Process Completed Successfully =====');
  } catch (error) {
    console.error('Error in seeding process:', error.message);
    process.exit(1);
  }
}

// Run the function
runScripts(); 