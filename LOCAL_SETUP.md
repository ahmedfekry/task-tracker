# Local Development Setup Guide

This guide will help you set up the Task Tracker application on your local Windows machine with SQL Server.

## Prerequisites

### 1. SQL Server Installation

#### Option A: SQL Server Express (Free, Recommended for Development)
1. Download [SQL Server 2019 Express](https://www.microsoft.com/en-us/sql-server/sql-server-downloads)
2. Run the installer and choose "Basic" installation
3. Note the instance name (default: `SQLEXPRESS`)
4. Note the connection string shown at the end

#### Option B: SQL Server Developer Edition (Free, Full Features)
1. Download [SQL Server 2019 Developer](https://www.microsoft.com/en-us/sql-server/sql-server-downloads)
2. Follow the installation wizard
3. Choose "Mixed Mode Authentication" when prompted
4. Set a strong password for the `sa` account (e.g., `YourStrong@Password`)

### 2. Enable SQL Server Authentication

1. Open **SQL Server Management Studio (SSMS)**
   - Download from [Microsoft SSMS](https://docs.microsoft.com/en-us/sql/ssms/download-sql-server-management-studio-ssms) if not installed
2. Connect to your SQL Server instance
   - Server name: `localhost\SQLEXPRESS` or just `localhost` (for default instance)
   - Authentication: Windows Authentication (initially)
3. Right-click the server name → **Properties**
4. Go to **Security** page
5. Select **SQL Server and Windows Authentication mode**
6. Click **OK**
7. **Restart SQL Server service**:
   - Open Services (Win+R, type `services.msc`)
   - Find `SQL Server (SQLEXPRESS)` or `SQL Server (MSSQLSERVER)`
   - Right-click → **Restart**

### 3. Enable sa Account (if disabled)

1. In SSMS, expand **Security** → **Logins**
2. Right-click **sa** → **Properties**
3. Go to **Status** page
4. Set Login to **Enabled**
5. Click **OK**

### 4. Node.js Installation

1. Download and install [Node.js 18+](https://nodejs.org/) (LTS version recommended)
2. Verify installation:
   ```powershell
   node --version  # Should show v18.x.x or higher
   npm --version   # Should show 9.x.x or higher
   ```

## Project Setup

### 1. Install Dependencies

#### Backend Dependencies
```powershell
cd server
npm install
```

This will install:
- `mssql` - SQL Server driver
- `express` - Web server framework
- `jsonwebtoken` - JWT authentication
- `bcryptjs` - Password hashing
- And other dependencies...

#### Frontend Dependencies
```powershell
cd ..  # Back to project root
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the `server` directory:

```powershell
cd server
New-Item -Path .env -ItemType File
```

Edit `server/.env` with your SQL Server configuration:

```env
# Server Configuration
PORT=3001
NODE_ENV=development

# SQL Server Configuration
DB_SERVER=localhost\SQLEXPRESS
# For default instance, use: DB_SERVER=localhost

DB_DATABASE=TaskTracker
DB_USER=sa
DB_PASSWORD=YourStrong@Password

# JWT Secret (change this to a random string)
JWT_SECRET=your-secret-key-change-this-in-production-use-long-random-string
```

**Important Notes:**
- For SQL Express: Use `localhost\SQLEXPRESS` (with backslash)
- For default instance: Use `localhost` or `localhost,1433`
- For named instance on specific port: Use `localhost,1433`
- Replace `YourStrong@Password` with your actual sa password

### 3. Create Database

Open SSMS and run this query:

```sql
CREATE DATABASE TaskTracker;
```

Or use PowerShell with sqlcmd:

```powershell
sqlcmd -S localhost\SQLEXPRESS -U sa -P YourStrong@Password -Q "CREATE DATABASE TaskTracker"
```

### 4. Run Database Migration

This will create all the necessary tables:

```powershell
cd server
npm run migrate
```

Expected output:
```
Starting database migration...
Connected to SQL Server database
Creating users table...
Creating projects table...
Creating tasks table...
Creating notification_settings table...
Database migration completed successfully
```

If you see errors:
- **Connection Failed**: Check SQL Server service is running
- **Login Failed**: Verify sa password in .env file
- **Database Not Found**: Create the database first (step 3)

## Running the Application

### 1. Start Backend Server

```powershell
cd server
npm run dev
```

Expected output:
```
Server running on port 3001
Connected to SQL Server database
```

The API will be available at: `http://localhost:3001`

### 2. Start Frontend Development Server

Open a **new terminal** (keep backend running):

```powershell
# From project root
npm run dev
```

Expected output:
```
VITE v5.x.x ready in xxx ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

### 3. Access the Application

Open your browser and navigate to: `http://localhost:5173`

## Testing the Setup

### 1. Create a Test User

Use a tool like Postman or curl:

```powershell
# Register a new user
curl -X POST http://localhost:3001/api/auth/register `
  -H "Content-Type: application/json" `
  -d '{\"email\":\"test@example.com\",\"password\":\"Test123!\",\"name\":\"Test User\"}'
```

Expected response:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "test@example.com",
    "name": "Test User",
    "role": "user"
  }
}
```

### 2. Login

```powershell
curl -X POST http://localhost:3001/api/auth/login `
  -H "Content-Type: application/json" `
  -d '{\"email\":\"test@example.com\",\"password\":\"Test123!\"}'
```

### 3. Test Database Connection

Check if the user was created in SQL Server:

```sql
-- In SSMS, run:
USE TaskTracker;
SELECT * FROM users;
```

## Common Issues and Solutions

### Issue: "Cannot connect to SQL Server"

**Solution 1**: Check if SQL Server is running
```powershell
Get-Service -Name 'MSSQL$SQLEXPRESS'
# Or for default instance:
Get-Service -Name MSSQLSERVER
```

If stopped, start it:
```powershell
Start-Service -Name 'MSSQL$SQLEXPRESS'
```

**Solution 2**: Enable TCP/IP protocol
1. Open **SQL Server Configuration Manager**
2. Expand **SQL Server Network Configuration**
3. Click **Protocols for SQLEXPRESS**
4. Right-click **TCP/IP** → **Enable**
5. Restart SQL Server service

**Solution 3**: Check Windows Firewall
```powershell
# Add firewall rule for SQL Server
New-NetFirewallRule -DisplayName "SQL Server" -Direction Inbound -Protocol TCP -LocalPort 1433 -Action Allow
```

### Issue: "Login failed for user 'sa'"

**Solutions**:
1. Verify Mixed Mode Authentication is enabled (see Prerequisites section)
2. Check sa account is enabled
3. Verify password in .env file matches SQL Server
4. Try resetting sa password in SSMS

### Issue: "Database 'TaskTracker' does not exist"

**Solution**: Create the database first
```sql
CREATE DATABASE TaskTracker;
```

### Issue: "npm install fails with node-gyp errors"

**Solution**: Install Windows Build Tools
```powershell
npm install --global windows-build-tools
```

Or install Visual Studio Build Tools manually from [Visual Studio Downloads](https://visualstudio.microsoft.com/downloads/)

### Issue: "Port 3001 already in use"

**Solution**: Change the port in server/.env
```env
PORT=3002
```

And update the frontend API URL in `src/services/*` files if needed.

### Issue: "CORS errors in browser"

**Solution**: Verify backend CORS configuration in `server/src/index.ts`
```typescript
app.use(cors({
  origin: 'http://localhost:5173', // Frontend URL
  credentials: true
}));
```

## Development Workflow

### Making Database Changes

1. Modify the migration script: `server/src/db/migrate.ts`
2. Drop existing tables (in SSMS):
   ```sql
   USE TaskTracker;
   DROP TABLE IF EXISTS notification_settings;
   DROP TABLE IF EXISTS tasks;
   DROP TABLE IF EXISTS projects;
   DROP TABLE IF EXISTS users;
   ```
3. Run migration again:
   ```powershell
   cd server
   npm run migrate
   ```

### Viewing Logs

Backend logs appear in the terminal where you ran `npm run dev`.

For SQL Server logs:
1. Open SSMS
2. Right-click server → **View SQL Server Log**

### Database Backup

Create a backup:
```sql
BACKUP DATABASE TaskTracker
TO DISK = 'C:\Backups\TaskTracker.bak'
WITH FORMAT;
```

Restore a backup:
```sql
USE master;
ALTER DATABASE TaskTracker SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
RESTORE DATABASE TaskTracker
FROM DISK = 'C:\Backups\TaskTracker.bak'
WITH REPLACE;
ALTER DATABASE TaskTracker SET MULTI_USER;
```

## Next Steps

- Create an admin user (update role in database or use registration + manual update)
- Configure notification settings
- Start creating projects and tasks
- Explore the admin dashboard features

## Useful SQL Queries

```sql
-- View all users
SELECT id, email, name, role, created_at FROM users;

-- View all projects
SELECT p.id, p.name, p.type, u.email as owner
FROM projects p
JOIN users u ON p.user_id = u.id;

-- View all tasks with project info
SELECT t.id, t.title, t.status, t.type, t.date, p.name as project, u.email as user
FROM tasks t
LEFT JOIN projects p ON t.project_id = p.id
JOIN users u ON t.user_id = u.id
ORDER BY t.date DESC;

-- Get task statistics by user
SELECT 
  u.email,
  COUNT(t.id) as total_tasks,
  SUM(CASE WHEN t.status = 'completed' THEN 1 ELSE 0 END) as completed_tasks
FROM users u
LEFT JOIN tasks t ON u.id = t.user_id
GROUP BY u.id, u.email;

-- Make a user admin
UPDATE users SET role = 'admin' WHERE email = 'test@example.com';
```

## Resources

- [SQL Server Documentation](https://docs.microsoft.com/en-us/sql/)
- [Express.js Guide](https://expressjs.com/en/guide/routing.html)
- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
