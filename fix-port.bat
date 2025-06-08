@echo off
echo Updating port in environment files...

powershell -Command "(Get-Content .env.local) -replace 'PORT=10000', 'PORT=3000' | Set-Content .env.local"
powershell -Command "(Get-Content .env.local) -replace 'NEXT_PUBLIC_BASE_URL=http://localhost:10000', 'NEXT_PUBLIC_BASE_URL=http://localhost:3000' | Set-Content .env.local"

powershell -Command "(Get-Content .env.production) -replace 'PORT=10000', 'PORT=3000' | Set-Content .env.production"
powershell -Command "(Get-Content .env.production) -replace 'NEXT_PUBLIC_BASE_URL=http://localhost:10000', 'NEXT_PUBLIC_BASE_URL=http://localhost:3000' | Set-Content .env.production"

echo Port updated to 3000 in all environment files.
echo Please restart the server for changes to take effect. 