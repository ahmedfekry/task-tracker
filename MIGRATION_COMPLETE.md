# SQL Server Migration - Final Steps

## ✅ What's Been Done

All backend code has been successfully converted from PostgreSQL to SQL Server:

### Updated Files
- ✅ `server/package.json` - Updated to use `mssql` instead of `pg`
- ✅ `server/.env.example` - New environment variable structure (you need to update your actual .env)
- ✅ `server/src/db/pool.ts` - SQL Server connection pooling
- ✅ `server/src/db/migrate.ts` - SQL Server DDL syntax with IDENTITY, NVARCHAR, etc.
- ✅ `server/src/routes/auth.ts` - Converted to parameterized queries
- ✅ `server/src/routes/projects.ts` - Converted to parameterized queries
- ✅ `server/src/routes/tasks.ts` - Converted to parameterized queries
- ✅ `server/src/routes/admin.ts` - Converted to parameterized queries

### Created Documentation
- ✅ `QUICKSTART.md` - 5-minute quick start guide
- ✅ `LOCAL_SETUP.md` - Comprehensive local development setup
- ✅ `VPS_DEPLOYMENT.md` - Production deployment guide
- ✅ `README.md` - Updated project documentation

## 🚀 Next Steps (To Run on Your Machine)

### Step 1: Install Dependencies (2 minutes)

```powershell
cd C:\Users\afekry\task-tracker-app\server
npm install
```

This will install:
- `mssql@10.0.1` - SQL Server driver
- All other dependencies

### Step 2: Verify SQL Server (1 minute)

Check if SQL Server is running:

```powershell
Get-Service -Name MSSQLSERVER
# OR for SQL Express:
Get-Service -Name 'MSSQL$SQLEXPRESS'
```

If stopped, start it:
```powershell
Start-Service -Name 'MSSQL$SQLEXPRESS'
```

### Step 3: Update Environment Variables (1 minute)

Edit `server\.env` with your actual SQL Server details:

```env
PORT=3001
NODE_ENV=development

# Update these with your SQL Server details:
DB_SERVER=localhost\SQLEXPRESS
# Or if default instance: DB_SERVER=localhost

DB_DATABASE=TaskTracker
DB_USER=sa
DB_PASSWORD=YOUR_ACTUAL_SA_PASSWORD_HERE

JWT_SECRET=your-secret-key-change-this-in-production
```

**Important**: Replace `YOUR_ACTUAL_SA_PASSWORD_HERE` with your real sa password.

### Step 4: Enable SQL Server Authentication (3 minutes)

If you haven't already:

1. Open **SQL Server Management Studio (SSMS)**
2. Connect to your SQL Server instance (localhost\SQLEXPRESS or localhost)
3. Right-click server name → **Properties**
4. Go to **Security** page
5. Select **SQL Server and Windows Authentication mode** (Mixed Mode)
6. Click **OK**
7. **Restart SQL Server** service:
   ```powershell
   Restart-Service -Name 'MSSQL$SQLEXPRESS'
   ```

### Step 5: Create Database (1 minute)

Option A - Using SSMS:
1. Open SSMS
2. Connect to your server
3. Right-click **Databases** → **New Database**
4. Name: `TaskTracker`
5. Click **OK**

Option B - Using PowerShell:
```powershell
sqlcmd -S localhost\SQLEXPRESS -U sa -P YOUR_PASSWORD -Q "CREATE DATABASE TaskTracker"
```

### Step 6: Run Migration (1 minute)

```powershell
cd C:\Users\afekry\task-tracker-app\server
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

If you see errors, check:
- SQL Server service is running
- sa password is correct in .env
- TaskTracker database exists
- TCP/IP protocol is enabled (see LOCAL_SETUP.md)

### Step 7: Test Backend (2 minutes)

```powershell
cd C:\Users\afekry\task-tracker-app\server
npm run dev
```

Expected output:
```
Server running on port 3001
Connected to SQL Server database
```

If successful, press Ctrl+C to stop for now.

### Step 8: Start Full Application (1 minute)

Open **TWO PowerShell terminals**:

**Terminal 1 - Backend:**
```powershell
cd C:\Users\afekry\task-tracker-app\server
npm run dev
```

**Terminal 2 - Frontend:**
```powershell
cd C:\Users\afekry\task-tracker-app
npm run dev
```

Access the application at: **http://localhost:5173**

### Step 9: Create First User (2 minutes)

1. Open browser to `http://localhost:5173`
2. Click **Register** or **Sign Up**
3. Fill in:
   - Email: your@email.com
   - Password: YourPassword123!
   - Name: Your Name
4. Click **Register**
5. You should be logged in automatically

### Step 10: Make Yourself Admin (1 minute)

Option A - Using SSMS:
```sql
USE TaskTracker;
UPDATE users SET role = 'admin' WHERE email = 'your@email.com';
```

Option B - Using sqlcmd:
```powershell
sqlcmd -S localhost\SQLEXPRESS -U sa -P YOUR_PASSWORD -d TaskTracker -Q "UPDATE users SET role = 'admin' WHERE email = 'your@email.com'"
```

Refresh the page to see admin features.

## ✅ Verification Checklist

Test these features to ensure everything works:

- [ ] Register a new user
- [ ] Login with credentials
- [ ] Create a project (Work or Personal)
- [ ] Create a task assigned to the project
- [ ] Edit the task
- [ ] Mark task as completed
- [ ] Delete the task
- [ ] View Admin Dashboard (if admin user)
- [ ] View all users (admin only)
- [ ] Export tasks to Excel

## 🔍 Troubleshooting Quick Reference

### "Cannot connect to SQL Server"

```powershell
# Check service status
Get-Service -Name 'MSSQL$SQLEXPRESS'

# Start if stopped
Start-Service -Name 'MSSQL$SQLEXPRESS'

# Check TCP/IP is enabled (see LOCAL_SETUP.md section)
```

### "Login failed for user 'sa'"

1. Verify Mixed Mode Authentication is enabled (Step 4 above)
2. Check sa account is enabled:
   - In SSMS: Security → Logins → Right-click `sa` → Properties → Status → Enabled
3. Verify password in .env matches SQL Server

### "Database 'TaskTracker' does not exist"

```powershell
sqlcmd -S localhost\SQLEXPRESS -U sa -P YOUR_PASSWORD -Q "CREATE DATABASE TaskTracker"
```

### "npm install fails"

If you get node-gyp errors:
```powershell
npm install --global windows-build-tools
```

Or install [Visual Studio Build Tools](https://visualstudio.microsoft.com/downloads/)

### Frontend can't connect to backend

1. Check backend is running (Terminal 1 shows "Server running on port 3001")
2. Verify no firewall blocking localhost:3001
3. Check browser console for CORS errors

## 📊 Testing Database

View your data in SSMS:

```sql
USE TaskTracker;

-- View all tables
SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES;

-- View users
SELECT id, email, name, role, created_at FROM users;

-- View projects
SELECT p.id, p.name, p.type, p.color, u.name as owner
FROM projects p
JOIN users u ON p.user_id = u.id;

-- View tasks
SELECT 
  t.id, 
  t.title, 
  t.status, 
  t.type, 
  t.date,
  p.name as project,
  u.name as user
FROM tasks t
LEFT JOIN projects p ON t.project_id = p.id
JOIN users u ON t.user_id = u.id
ORDER BY t.date DESC;
```

## 🌐 For VPS Deployment

Once everything works locally, see [VPS_DEPLOYMENT.md](VPS_DEPLOYMENT.md) for:

- SQL Server installation on Windows Server
- IIS or PM2 configuration
- SSL/HTTPS setup
- Security hardening
- Automated backups
- Monitoring setup

## 📝 Important Notes

### Database Connection String Format

Different SQL Server instances use different connection strings:

- **Default Instance**: `localhost` or `localhost,1433`
- **Named Instance (Express)**: `localhost\SQLEXPRESS`
- **Remote Server**: `SERVER_IP\INSTANCE_NAME` or `SERVER_IP,PORT`
- **Azure SQL**: `your-server.database.windows.net`

### SQL Server Editions

- **Express**: Free, 10GB database limit, 1GB RAM limit, 4 cores max
- **Standard**: Licensed, 524 PB database limit, OS max RAM, 24 cores max
- **Enterprise**: Licensed, 524 PB database limit, OS max RAM, unlimited cores

Express is perfect for development and small production deployments.

### Port Numbers

- **SQL Server**: Default 1433 (TCP)
- **Backend API**: 3001 (configurable in .env)
- **Frontend Dev**: 5173 (Vite default)
- **Frontend Prod**: 80 (HTTP) or 443 (HTTPS)

### Security Considerations

For production:
- ✅ Change JWT_SECRET to long random string
- ✅ Use dedicated SQL user (not sa)
- ✅ Enable SQL Server encryption
- ✅ Use HTTPS for all communication
- ✅ Enable SQL Server audit logging
- ✅ Regular backups (automated)
- ✅ Keep SQL Server and Node.js updated

## 🎉 Success Criteria

You're all set when you can:

1. ✅ Backend starts without errors
2. ✅ Frontend connects to backend
3. ✅ Can register and login
4. ✅ Can create projects and tasks
5. ✅ Data persists after browser refresh
6. ✅ Can view data in SQL Server Management Studio

## 📚 Additional Resources

- **Quick Start**: [QUICKSTART.md](QUICKSTART.md)
- **Local Setup**: [LOCAL_SETUP.md](LOCAL_SETUP.md)
- **VPS Deployment**: [VPS_DEPLOYMENT.md](VPS_DEPLOYMENT.md)
- **SQL Server Docs**: https://docs.microsoft.com/en-us/sql/
- **Node.js mssql**: https://github.com/tediousjs/node-mssql

## 🆘 Need Help?

1. Check [LOCAL_SETUP.md](LOCAL_SETUP.md) troubleshooting section
2. Review SQL Server error logs (SSMS → Management → SQL Server Logs)
3. Check backend terminal output for error messages
4. Verify all environment variables are set correctly

## 🎯 What Changed from PostgreSQL

| Aspect | PostgreSQL (Old) | SQL Server (New) |
|--------|-----------------|-----------------|
| Package | `pg` | `mssql` |
| Connection | Single `DATABASE_URL` | Separate server/database/user/password |
| Parameters | `$1, $2, $3` | `@param1, @param2` |
| Results | `.rows` | `.recordset` |
| Identity | `SERIAL` | `INT IDENTITY(1,1)` |
| Strings | `VARCHAR`, `TEXT` | `NVARCHAR`, `NVARCHAR(MAX)` |
| Dates | `TIMESTAMP` | `DATETIME2` |
| Booleans | `BOOLEAN` | `BIT` |
| Output | `RETURNING *` | `OUTPUT INSERTED.*` |
| Limit | `LIMIT N` | `SELECT TOP N` |

---

**All code changes are complete. Follow the steps above to run on your machine! 🚀**
