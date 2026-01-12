# Quick Start Guide - SQL Server Migration

## What Changed?

Your Task Tracker application now uses **SQL Server** instead of PostgreSQL for data persistence.

### Key Changes:
- **Database**: PostgreSQL → SQL Server
- **Driver**: `pg` package → `mssql` package  
- **Connection**: Single DATABASE_URL → Separate DB_SERVER, DB_DATABASE, DB_USER, DB_PASSWORD
- **Query Syntax**: PostgreSQL `$1, $2` → SQL Server `@param` parameterized queries

## Quick Local Setup (5 minutes)

### 1. Install SQL Server Express (if not installed)
```powershell
# Download from: https://www.microsoft.com/en-us/sql-server/sql-server-downloads
# Install with "Basic" option, enable Mixed Mode Authentication
```

### 2. Configure SQL Server
```powershell
# Open SQL Server Management Studio (SSMS)
# Connect to: localhost\SQLEXPRESS
# Enable SQL Server Authentication (see LOCAL_SETUP.md for details)
```

### 3. Install Dependencies
```powershell
# Backend
cd server
npm install  # Installs mssql and other packages

# Frontend (no changes needed)
cd ..
npm install
```

### 4. Configure Environment
Edit `server\.env`:
```env
PORT=3001
NODE_ENV=development

DB_SERVER=localhost\SQLEXPRESS
DB_DATABASE=TaskTracker
DB_USER=sa
DB_PASSWORD=YourStrong@Password

JWT_SECRET=your-secret-key-change-this-in-production
```

### 5. Create Database
```sql
-- In SSMS or sqlcmd:
CREATE DATABASE TaskTracker;
```

Or with PowerShell:
```powershell
sqlcmd -S localhost\SQLEXPRESS -U sa -P YourStrong@Password -Q "CREATE DATABASE TaskTracker"
```

### 6. Run Migration
```powershell
cd server
npm run migrate
```

Expected output: `Database migration completed successfully`

### 7. Start the Application
```powershell
# Terminal 1: Backend
cd server
npm run dev

# Terminal 2: Frontend
cd ..
npm run dev
```

Access at: `http://localhost:5173`

## Common Issues

### "Cannot connect to SQL Server"
**Fix**: Start SQL Server service
```powershell
Start-Service -Name 'MSSQL$SQLEXPRESS'
```

### "Login failed for user 'sa'"
**Fix**: Enable Mixed Mode Authentication
1. Open SSMS
2. Right-click server → Properties → Security
3. Select "SQL Server and Windows Authentication mode"
4. Restart SQL Server service

### "Database 'TaskTracker' does not exist"
**Fix**: Create it first (step 5 above)

## VPS Deployment

See [VPS_DEPLOYMENT.md](VPS_DEPLOYMENT.md) for complete production deployment guide covering:
- SQL Server installation and configuration
- IIS or PM2 setup
- SSL/HTTPS configuration
- Security hardening
- Monitoring and backups
- Performance optimization

## File Changes Summary

### Modified Files:
- `server/package.json` - Updated dependencies (mssql instead of pg)
- `server/.env` - New environment variable structure
- `server/src/db/pool.ts` - SQL Server connection pool
- `server/src/db/migrate.ts` - SQL Server DDL syntax
- `server/src/routes/auth.ts` - Parameterized queries
- `server/src/routes/projects.ts` - Parameterized queries
- `server/src/routes/tasks.ts` - Parameterized queries
- `server/src/routes/admin.ts` - Parameterized queries

### Unchanged Files:
- `server/src/middleware/auth.ts` - JWT logic (database-agnostic)
- `server/src/index.ts` - Express server setup
- All frontend files - React app unchanged

## Next Steps

1. **Test locally** - Follow Quick Local Setup above
2. **Create admin user** - Register, then update role in database:
   ```sql
   UPDATE users SET role = 'admin' WHERE email = 'your@email.com';
   ```
3. **Configure VPS** - Follow VPS_DEPLOYMENT.md for production deployment

## Need Help?

- **Local Setup Issues**: See [LOCAL_SETUP.md](LOCAL_SETUP.md)
- **VPS Deployment**: See [VPS_DEPLOYMENT.md](VPS_DEPLOYMENT.md)
- **SQL Server Help**: https://docs.microsoft.com/en-us/sql/

## SQL Server Quick Reference

### Connect with sqlcmd
```powershell
sqlcmd -S localhost\SQLEXPRESS -U sa -P YourPassword
```

### Useful Queries
```sql
-- View all databases
SELECT name FROM sys.databases;

-- Use TaskTracker database
USE TaskTracker;

-- View all tables
SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES;

-- View all users
SELECT id, email, name, role FROM users;

-- Make user admin
UPDATE users SET role = 'admin' WHERE email = 'user@example.com';

-- View task counts
SELECT 
  u.name,
  COUNT(t.id) as total_tasks,
  SUM(CASE WHEN t.status = 'completed' THEN 1 ELSE 0 END) as completed
FROM users u
LEFT JOIN tasks t ON u.id = t.user_id
GROUP BY u.id, u.name;
```

### Check SQL Server Status
```powershell
# Check if running
Get-Service -Name 'MSSQL$SQLEXPRESS'

# Start service
Start-Service -Name 'MSSQL$SQLEXPRESS'

# Stop service
Stop-Service -Name 'MSSQL$SQLEXPRESS'
```

### SQL Server Configuration Manager
- Enable TCP/IP: Configuration Manager → SQL Server Network Configuration → Protocols for SQLEXPRESS → TCP/IP → Enable
- Change Port: TCP/IP Properties → IP Addresses → IPAll → TCP Port
- Restart required after changes

## Environment Variables Reference

### Local Development (.env)
```env
PORT=3001
NODE_ENV=development
DB_SERVER=localhost\SQLEXPRESS
DB_DATABASE=TaskTracker
DB_USER=sa
DB_PASSWORD=YourStrong@Password
JWT_SECRET=dev-secret-change-in-production
```

### Production (.env)
```env
PORT=3001
NODE_ENV=production
DB_SERVER=localhost  # or VPS IP
DB_DATABASE=TaskTracker
DB_USER=TaskTrackerApp  # dedicated user, not sa
DB_PASSWORD=YourVeryStrong@Password123!
JWT_SECRET=<64-char-random-string>  # Generate with: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
CORS_ORIGIN=https://yourdomain.com
```

## Database Schema Overview

```
users
├── id (INT IDENTITY PRIMARY KEY)
├── email (NVARCHAR UNIQUE)
├── password (NVARCHAR - bcrypt hashed)
├── name (NVARCHAR)
├── role (NVARCHAR - 'user' or 'admin')
└── created_at (DATETIME2)

projects
├── id (INT IDENTITY PRIMARY KEY)
├── user_id (INT FK → users.id)
├── name (NVARCHAR)
├── type (NVARCHAR - 'work' or 'personal')
├── color (NVARCHAR)
└── created_at (DATETIME2)

tasks
├── id (INT IDENTITY PRIMARY KEY)
├── user_id (INT FK → users.id)
├── project_id (INT FK → projects.id)
├── title (NVARCHAR)
├── description (NVARCHAR(MAX))
├── type (NVARCHAR - 'work' or 'personal')
├── date (DATETIME2)
├── start_time (DATETIME2)
├── end_time (DATETIME2)
├── duration (INT - minutes)
├── status (NVARCHAR - 'pending', 'in-progress', 'completed')
└── created_at (DATETIME2)

notification_settings
├── id (INT IDENTITY PRIMARY KEY)
├── user_id (INT FK → users.id)
├── enabled (BIT)
├── time (NVARCHAR)
└── created_at (DATETIME2)
```

## API Endpoints (Unchanged)

### Authentication
- POST `/api/auth/register` - Create account
- POST `/api/auth/login` - Login and get JWT token

### Tasks (Requires JWT)
- GET `/api/tasks` - List user's tasks
- POST `/api/tasks` - Create task
- PUT `/api/tasks/:id` - Update task
- DELETE `/api/tasks/:id` - Delete task

### Projects (Requires JWT)
- GET `/api/projects` - List user's projects
- POST `/api/projects` - Create project
- PUT `/api/projects/:id` - Update project
- DELETE `/api/projects/:id` - Delete project

### Admin (Requires JWT + Admin Role)
- GET `/api/admin/users` - List all users
- GET `/api/admin/users/:userId/stats` - User statistics
- GET `/api/admin/users/:userId/tasks` - User's tasks
- GET `/api/admin/tasks/all` - All tasks overview
- PATCH `/api/admin/users/:userId/role` - Update user role
