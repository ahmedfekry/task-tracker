# Task Tracker - Local Windows Deployment Guide

## Prerequisites
- ✅ Node.js installed
- ✅ SQL Server installed (MSSQLSERVER01 instance)
- ✅ Database configured and migrated
- ✅ Backend .env file configured

## Quick Start

### Option 1: Production Mode (Single Server)
**Best for**: Running as a local production application

1. **Double-click** `start-production.bat`
   - OR run: `.\start-production.bat`

The script will:
- Check/start SQL Server
- Build the frontend
- Build the backend
- Start production server on port 3001
- Serve both API and frontend from http://localhost:3001

### Option 2: Development Mode (Dual Servers)
**Best for**: Active development with hot reload

1. **Double-click** `start-development.bat`
   - OR run: `.\start-development.bat`

The script will:
- Check/start SQL Server
- Start backend server on port 3001
- Start frontend dev server on port 5173
- Open both in separate terminal windows

Access: http://localhost:5173

---

## Manual Steps

### Production Deployment

1. **Build Frontend**
   ```powershell
   npm run build
   ```

2. **Build Backend**
   ```powershell
   cd server
   npm run build
   ```

3. **Set Environment**
   ```powershell
   cd server
   $env:NODE_ENV="production"
   ```

4. **Start Server**
   ```powershell
   node dist/index.js
   ```

5. **Access Application**
   Open browser: http://localhost:3001

### Development Mode

**Terminal 1 - Backend:**
```powershell
cd server
npm run dev
```

**Terminal 2 - Frontend:**
```powershell
npm run dev
```

**Access:** http://localhost:5173

---

## SQL Server Management

### Check SQL Server Status
```powershell
Get-Service -Name "MSSQL$MSSQLSERVER01"
```

### Start SQL Server
```powershell
Start-Service -Name "MSSQL$MSSQLSERVER01"
```

### Stop SQL Server
```powershell
Stop-Service -Name "MSSQL$MSSQLSERVER01"
```

---

## Troubleshooting

### Port Already in Use
**Backend (3001):**
```powershell
# Find process using port 3001
netstat -ano | findstr :3001
# Kill process (replace PID)
taskkill /PID <PID> /F
```

**Frontend (5173):**
```powershell
# Find process using port 5173
netstat -ano | findstr :5173
# Kill process
taskkill /PID <PID> /F
```

### SQL Server Connection Issues
1. Verify SQL Server is running
2. Check port 58521 is accessible:
   ```powershell
   sqlcmd -S 127.0.0.1,58521 -U taskuser01 -P StrongPassword@123 -d task-manager -Q "SELECT 1"
   ```
3. If port changed, check error log:
   ```powershell
   sqlcmd -S DFN-LPIT620\MSSQLSERVER01 -E -Q "EXEC xp_readerrorlog 0, 1, N'Server is listening on'"
   ```

### Build Errors
```powershell
# Clean install frontend
Remove-Item -Recurse -Force node_modules
npm install

# Clean install backend
cd server
Remove-Item -Recurse -Force node_modules
npm install
```

---

## Running as Windows Service

### Using NSSM (Non-Sucking Service Manager)

1. **Install NSSM**
   ```powershell
   # Download from https://nssm.cc/download
   # Or use Chocolatey:
   choco install nssm
   ```

2. **Create Service**
   ```powershell
   nssm install TaskTrackerApp "C:\Program Files\nodejs\node.exe"
   nssm set TaskTrackerApp AppDirectory "C:\Users\afekry\task-tracker-app\server"
   nssm set TaskTrackerApp AppParameters "dist\index.js"
   nssm set TaskTrackerApp AppEnvironmentExtra NODE_ENV=production
   ```

3. **Start Service**
   ```powershell
   Start-Service TaskTrackerApp
   ```

---

## Configuration Files

### Backend Environment (.env)
Location: `server/.env`
```env
PORT=3001
DB_SERVER=127.0.0.1
DB_PORT=58521
DB_DATABASE=task-manager
DB_USER=taskuser01
DB_PASSWORD=StrongPassword@123
JWT_SECRET=your-secret-key-change-this-in-production@123456!545
NODE_ENV=production
```

### Frontend Environment (if needed)
Create `.env` in root:
```env
VITE_API_URL=http://localhost:3001/api
```

---

## Auto-Start on Windows Boot

### Option 1: Task Scheduler
1. Open Task Scheduler
2. Create Basic Task
3. Trigger: "When computer starts"
4. Action: Start a program
5. Program: `C:\Users\afekry\task-tracker-app\start-production.bat`
6. Check "Run with highest privileges"

### Option 2: Startup Folder
1. Press `Win + R`
2. Type: `shell:startup`
3. Create shortcut to `start-production.bat`

---

## Maintenance

### View Logs
```powershell
# Backend logs (if you add logging)
Get-Content server/logs/app.log -Wait

# SQL Server logs
sqlcmd -S DFN-LPIT620\MSSQLSERVER01 -E -Q "EXEC xp_readerrorlog"
```

### Backup Database
```powershell
sqlcmd -S 127.0.0.1,58521 -U taskuser01 -P StrongPassword@123 -Q "BACKUP DATABASE [task-manager] TO DISK = 'C:\Backup\task-manager.bak'"
```

### Update Application
```powershell
# Pull latest changes
git pull

# Rebuild
npm run build
cd server
npm run build

# Restart (if using batch file, just stop and start again)
```

---

## Performance Tips

1. **Enable SQL Server TCP/IP permanently** in SQL Server Configuration Manager
2. **Set static port** instead of dynamic (58521) for stability
3. **Enable compression** in production:
   ```typescript
   // Add to server/src/index.ts
   import compression from 'compression';
   app.use(compression());
   ```
4. **Add caching headers** for static files
5. **Monitor SQL Server performance** using Activity Monitor

---

## Support

- Check `QUICKSTART.md` for initial setup
- Check `LOCAL_SETUP.md` for detailed configuration
- Check `MIGRATION_COMPLETE.md` for migration steps
- Check backend logs in terminal for errors
- Check browser console for frontend errors
