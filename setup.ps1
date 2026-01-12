# Task Tracker Setup Script

Write-Host "=== Task Tracker Setup ===" -ForegroundColor Cyan
Write-Host ""

# Check if PostgreSQL is installed
Write-Host "Checking PostgreSQL installation..." -ForegroundColor Yellow
$pgInstalled = Get-Command psql -ErrorAction SilentlyContinue

if (-not $pgInstalled) {
    Write-Host "PostgreSQL is NOT installed!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please install PostgreSQL:" -ForegroundColor Yellow
    Write-Host "1. Download from: https://www.postgresql.org/download/windows/" -ForegroundColor White
    Write-Host "2. Run the installer" -ForegroundColor White
    Write-Host "3. Remember your postgres user password" -ForegroundColor White
    Write-Host "4. Re-run this script after installation" -ForegroundColor White
    Write-Host ""
    
    $download = Read-Host "Would you like to open the download page? (y/n)"
    if ($download -eq 'y') {
        Start-Process "https://www.postgresql.org/download/windows/"
    }
    
    exit
}

Write-Host "✓ PostgreSQL is installed" -ForegroundColor Green
Write-Host ""

# Get PostgreSQL password
Write-Host "Enter your PostgreSQL password for user 'postgres':" -ForegroundColor Yellow
$pgPassword = Read-Host -AsSecureString
$pgPasswordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($pgPassword))

# Test connection
Write-Host ""
Write-Host "Testing PostgreSQL connection..." -ForegroundColor Yellow
$env:PGPASSWORD = $pgPasswordPlain
$testResult = psql -U postgres -c "SELECT 1;" 2>&1

if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Failed to connect to PostgreSQL" -ForegroundColor Red
    Write-Host "Please check your password and try again" -ForegroundColor Red
    exit
}

Write-Host "✓ Connected to PostgreSQL" -ForegroundColor Green
Write-Host ""

# Create database
Write-Host "Creating database 'task_tracker'..." -ForegroundColor Yellow
$createDb = psql -U postgres -c "CREATE DATABASE task_tracker;" 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Database created successfully" -ForegroundColor Green
} else {
    if ($createDb -like "*already exists*") {
        Write-Host "✓ Database already exists" -ForegroundColor Green
    } else {
        Write-Host "✗ Failed to create database" -ForegroundColor Red
        Write-Host $createDb
        exit
    }
}

Write-Host ""

# Update .env file
Write-Host "Updating server/.env file..." -ForegroundColor Yellow
$envContent = @"
PORT=3001
DATABASE_URL=postgresql://postgres:$pgPasswordPlain@localhost:5432/task_tracker
JWT_SECRET=$(New-Guid)
NODE_ENV=development
"@

Set-Content -Path "server\.env" -Value $envContent
Write-Host "✓ Environment file updated" -ForegroundColor Green
Write-Host ""

# Install server dependencies
Write-Host "Installing server dependencies..." -ForegroundColor Yellow
Push-Location server
npm install | Out-Null
Write-Host "✓ Server dependencies installed" -ForegroundColor Green
Pop-Location
Write-Host ""

# Run migration
Write-Host "Running database migration..." -ForegroundColor Yellow
Push-Location server
npm run migrate
Pop-Location

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Database migration completed" -ForegroundColor Green
} else {
    Write-Host "✗ Migration failed" -ForegroundColor Red
    exit
}

Write-Host ""
Write-Host "=== Setup Complete! ===" -ForegroundColor Green
Write-Host ""
Write-Host "To start the application:" -ForegroundColor Cyan
Write-Host "1. Start backend:  cd server && npm run dev" -ForegroundColor White
Write-Host "2. Start frontend: npm run dev (in new terminal)" -ForegroundColor White
Write-Host ""
Write-Host "Then visit: http://localhost:5173" -ForegroundColor Cyan
Write-Host ""

$startNow = Read-Host "Would you like to start the servers now? (y/n)"
if ($startNow -eq 'y') {
    Write-Host ""
    Write-Host "Starting backend server..." -ForegroundColor Yellow
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\server'; npm run dev"
    
    Start-Sleep -Seconds 3
    
    Write-Host "Starting frontend..." -ForegroundColor Yellow
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; npm run dev"
    
    Write-Host ""
    Write-Host "✓ Servers are starting in separate windows" -ForegroundColor Green
    Write-Host "Visit http://localhost:5173 when ready" -ForegroundColor Cyan
}
