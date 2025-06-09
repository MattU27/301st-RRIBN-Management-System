@echo off
REM Script to seed training completion data

REM Navigate to the project root directory
cd /d "%~dp0\.."

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Node.js is not installed. Please install Node.js and try again.
    exit /b 1
)

REM Run the seed script
echo Seeding training completion data...
node src/scripts/seed-training-completions.js

REM Check if the script executed successfully
if %ERRORLEVEL% EQU 0 (
    echo Training completion data seeded successfully!
) else (
    echo Failed to seed training completion data.
    exit /b 1
)

exit /b 0 