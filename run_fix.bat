@echo off
REM Script to run the MongoDB fix for document uploader information

echo Running fix for document uploader information...
echo This script will update documents where John Matthew Banto is incorrectly showing as Javier Velasco

REM Check if mongosh is installed
where mongosh >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo Running MongoDB script...
    mongosh --file fix_document_uploader.js
) else (
    echo MongoDB shell (mongosh) not found. Please install it first.
    echo You can run the script manually with: mongosh --file fix_document_uploader.js
)

echo Done!
pause 