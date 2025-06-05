@echo off
echo Running document uploader fix script...
echo.

REM Check if MongoDB is running
echo Checking MongoDB status...
tasklist /fi "imagename eq mongod.exe" | find "mongod.exe" > nul
if %errorlevel% neq 0 (
    echo MongoDB is not running. Please start MongoDB first.
    exit /b 1
)

echo MongoDB is running.
echo.

REM Run the MongoDB script
echo Running fix_document_uploaders_v2.js...
mongo mongodb://localhost:27017/afp_personnel_db fix_document_uploaders_v2.js

echo.
echo Script execution completed.
echo.

pause 