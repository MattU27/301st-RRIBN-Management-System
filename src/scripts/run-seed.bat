@echo off
echo ===== Starting Database Seeding Process =====

set ROOT_DIR=%~dp0..\..
set TS_NODE=%ROOT_DIR%\node_modules\.bin\ts-node.cmd

echo Step 1: Seeding companies...
"%TS_NODE%" "%~dp0seedCompanies.ts"
if %ERRORLEVEL% neq 0 (
  echo Error seeding companies
  exit /b 1
)

echo Step 2: Seeding personnel...
"%TS_NODE%" "%~dp0seedPersonnel.ts"
if %ERRORLEVEL% neq 0 (
  echo Error seeding personnel
  exit /b 1
)

echo ===== Database Seeding Process Completed Successfully =====
exit /b 0 