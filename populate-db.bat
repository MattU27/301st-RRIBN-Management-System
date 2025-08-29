@echo off
REM AFP Personnel Management System - Database Population Script (Windows)
REM This script sets up and populates the database with realistic test data

setlocal enabledelayedexpansion

REM Default values
set USE_JSON_FALLBACK=%USE_JSON_FALLBACK%
if "%USE_JSON_FALLBACK%"=="" set USE_JSON_FALLBACK=false
set MONGODB_URI=%MONGODB_URI%
if "%MONGODB_URI%"=="" set MONGODB_URI=mongodb://localhost:27017/afp_personnel_db
set CREATE_BACKUP=true

REM Parse command line arguments
:parse_args
if "%1"=="" goto main
if "%1"=="--json-fallback" (
    set USE_JSON_FALLBACK=true
    shift
    goto parse_args
)
if "%1"=="--mongodb-uri" (
    set MONGODB_URI=%2
    shift
    shift
    goto parse_args
)
if "%1"=="--no-backup" (
    set CREATE_BACKUP=false
    shift
    goto parse_args
)
if "%1"=="--help" goto show_usage
if "%1"=="-h" goto show_usage

echo [ERROR] Unknown option: %1
goto show_usage

:show_usage
echo Usage: %0 [OPTIONS]
echo.
echo Options:
echo   --json-fallback    Use JSON files instead of MongoDB
echo   --mongodb-uri URI  MongoDB connection string
echo   --no-backup        Skip creating backup of existing data
echo   --help             Show this help message
echo.
echo Environment Variables:
echo   MONGODB_URI        MongoDB connection string
echo   USE_JSON_FALLBACK  Set to 'true' to use JSON files
echo   NODE_ENV           Node environment (default: development)
echo.
echo Examples:
echo   %0                           # Use MongoDB with default settings
echo   %0 --json-fallback           # Use JSON files
echo   %0 --mongodb-uri mongodb://user:pass@host:port/db
goto end

:main
echo [INFO] AFP Personnel Management System - Database Population
echo [INFO] =================================================

REM Check Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js is not installed. Please install Node.js 16 or higher.
    exit /b 1
)

for /f "tokens=1 delims=v" %%i in ('node --version') do set NODE_VERSION=%%i
echo [SUCCESS] Node.js version: %NODE_VERSION%

REM Check if dependencies are installed
if not exist "node_modules" (
    echo [INFO] Installing Node.js dependencies...
    npm install
    if errorlevel 1 (
        echo [ERROR] Failed to install dependencies
        exit /b 1
    )
)

REM Check MongoDB if not using JSON fallback
if "%USE_JSON_FALLBACK%"=="false" (
    mongo --eval "db.runCommand('ping')" >nul 2>&1
    if errorlevel 1 (
        mongosh --eval "db.runCommand('ping')" >nul 2>&1
        if errorlevel 1 (
            echo [WARNING] MongoDB not accessible. Switching to JSON fallback mode.
            set USE_JSON_FALLBACK=true
        ) else (
            echo [SUCCESS] MongoDB is running and accessible
        )
    ) else (
        echo [SUCCESS] MongoDB is running and accessible
    )
)

REM Create backup if requested
if "%CREATE_BACKUP%"=="true" (
    if "%USE_JSON_FALLBACK%"=="true" (
        if exist "afp_personnel_db" (
            for /f "tokens=2-4 delims=/ " %%a in ('date /t') do set DATE=%%c%%a%%b
            for /f "tokens=1-2 delims=: " %%a in ('time /t') do set TIME=%%a%%b
            set TIME=!TIME:~0,4!
            set BACKUP_DIR=afp_personnel_db_backup_!DATE!_!TIME!
            echo [INFO] Creating backup of existing JSON data: !BACKUP_DIR!
            xcopy /E /I afp_personnel_db "!BACKUP_DIR!" >nul
            echo [SUCCESS] Backup created: !BACKUP_DIR!
        )
    )
)

REM Set environment variables and run population script
echo [INFO] Configuration:
echo [INFO]   - MongoDB URI: %MONGODB_URI%
echo [INFO]   - Use JSON Fallback: %USE_JSON_FALLBACK%

if not exist "scripts\populate-database.js" (
    echo [ERROR] Population script not found: scripts\populate-database.js
    exit /b 1
)

echo [INFO] Starting database population...
node scripts/populate-database.js
if errorlevel 1 (
    echo [ERROR] Database population failed
    exit /b 1
)

echo [SUCCESS] Database population completed successfully!
echo [INFO] You can now start your application with: npm run dev

if "%USE_JSON_FALLBACK%"=="true" (
    echo [INFO] Note: Using JSON file database. Data is stored in 'afp_personnel_db\' directory
)

:end
endlocal

