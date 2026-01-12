# VPS Deployment Guide

This guide covers deploying the Task Tracker application to a Windows VPS with SQL Server.

## VPS Requirements

### Minimum Specifications
- **OS**: Windows Server 2016 or later
- **RAM**: 4GB minimum (8GB recommended)
- **CPU**: 2 cores minimum
- **Storage**: 50GB SSD
- **SQL Server**: SQL Server 2016 or later (Express, Standard, or Enterprise)

### Required Software
- SQL Server (any edition)
- Node.js 18+ LTS
- IIS (Internet Information Services) or PM2 for process management
- Git (optional, for code deployment)

## Pre-Deployment Checklist

- [ ] VPS is running and accessible via RDP
- [ ] SQL Server is installed and configured
- [ ] Node.js is installed
- [ ] Domain name configured (if using custom domain)
- [ ] SSL certificate obtained (recommended)
- [ ] Firewall rules configured

## SQL Server Setup on VPS

### 1. Install SQL Server

If SQL Server is not already installed:

1. Download SQL Server installer from [Microsoft SQL Server Downloads](https://www.microsoft.com/en-us/sql-server/sql-server-downloads)
2. Run installer with these settings:
   - **Edition**: Express (free), Standard, or Enterprise
   - **Authentication Mode**: Mixed Mode (SQL Server and Windows Authentication)
   - **sa Password**: Set a strong password (e.g., use 20+ characters with special chars)
   - **Collation**: Default (SQL_Latin1_General_CP1_CI_AS)

### 2. Configure SQL Server for Remote Access

#### Enable TCP/IP Protocol

1. Open **SQL Server Configuration Manager**
2. Navigate to **SQL Server Network Configuration** → **Protocols for MSSQLSERVER**
3. Right-click **TCP/IP** → **Properties**
4. Set **Enabled** to **Yes**
5. Go to **IP Addresses** tab
6. Find **IPAll** section at the bottom
7. Set **TCP Port** to `1433` (or custom port for security)
8. Click **OK**
9. Restart SQL Server service:
   ```powershell
   Restart-Service -Name MSSQLSERVER
   ```

#### Configure Windows Firewall

```powershell
# Allow SQL Server port (change 1433 if using custom port)
New-NetFirewallRule -DisplayName "SQL Server" -Direction Inbound -Protocol TCP -LocalPort 1433 -Action Allow

# Allow Node.js API port
New-NetFirewallRule -DisplayName "Task Tracker API" -Direction Inbound -Protocol TCP -LocalPort 3001 -Action Allow

# Allow HTTPS (if hosting frontend on same server)
New-NetFirewallRule -DisplayName "HTTPS" -Direction Inbound -Protocol TCP -LocalPort 443 -Action Allow
```

### 3. Create Production Database

Connect to SQL Server using SSMS and run:

```sql
CREATE DATABASE TaskTracker;
GO

USE TaskTracker;
GO
```

### 4. Create Dedicated SQL User (Recommended)

Instead of using `sa` in production, create a dedicated user:

```sql
-- Create login
CREATE LOGIN TaskTrackerApp WITH PASSWORD = 'YourVeryStrong@Password123!';
GO

-- Create user in TaskTracker database
USE TaskTracker;
CREATE USER TaskTrackerApp FOR LOGIN TaskTrackerApp;
GO

-- Grant necessary permissions
ALTER ROLE db_owner ADD MEMBER TaskTrackerApp;
GO
```

## Application Deployment

### Option A: Using Git (Recommended)

1. **Install Git** (if not already installed):
   ```powershell
   winget install Git.Git
   ```

2. **Clone Repository**:
   ```powershell
   cd C:\inetpub
   git clone <your-repository-url> task-tracker
   cd task-tracker
   ```

3. **Install Dependencies**:
   ```powershell
   # Frontend
   npm install

   # Backend
   cd server
   npm install
   cd ..
   ```

### Option B: Manual File Transfer

1. **Copy Files**:
   - Use FTP, SFTP, or RDP to copy project folder to VPS
   - Recommended location: `C:\inetpub\task-tracker`

2. **Install Dependencies** (same as Option A step 3)

### Configure Environment Variables

Create `server\.env` file with production settings:

```env
# Server Configuration
PORT=3001
NODE_ENV=production

# SQL Server Configuration
DB_SERVER=localhost
# Or if using custom port: DB_SERVER=localhost,1433
# Or if using named instance: DB_SERVER=localhost\SQLEXPRESS

DB_DATABASE=TaskTracker
DB_USER=TaskTrackerApp
DB_PASSWORD=YourVeryStrong@Password123!

# JWT Secret - MUST BE CHANGED FOR PRODUCTION
# Generate with: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_SECRET=your-production-secret-key-use-very-long-random-string-here

# CORS Configuration (add your frontend domain)
CORS_ORIGIN=https://yourdomain.com
```

**Security Best Practices**:
- Never commit `.env` file to version control
- Use different JWT_SECRET for production (generate with crypto)
- Use strong database password (20+ characters)
- Consider using Azure Key Vault or similar for secrets

### Run Database Migration

```powershell
cd C:\inetpub\task-tracker\server
npm run migrate
```

Verify tables were created:
```sql
USE TaskTracker;
SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES;
```

### Build Frontend

```powershell
cd C:\inetpub\task-tracker
npm run build
```

This creates a `dist` folder with optimized production files.

## Hosting Options

### Option 1: IIS (Internet Information Services)

#### Setup Backend API with IISNode

1. **Install IIS and IISNode**:
   ```powershell
   # Enable IIS
   Enable-WindowsOptionalFeature -Online -FeatureName IIS-WebServerRole
   Enable-WindowsOptionalFeature -Online -FeatureName IIS-WebServer
   Enable-WindowsOptionalFeature -Online -FeatureName IIS-ApplicationDevelopment
   Enable-WindowsOptionalFeature -Online -FeatureName IIS-ISAPIExtensions
   Enable-WindowsOptionalFeature -Online -FeatureName IIS-ISAPIFilter
   
   # Download and install iisnode
   # https://github.com/Azure/iisnode/releases
   ```

2. **Create web.config** in `server` folder:
   ```xml
   <?xml version="1.0" encoding="utf-8"?>
   <configuration>
     <system.webServer>
       <handlers>
         <add name="iisnode" path="dist/index.js" verb="*" modules="iisnode"/>
       </handlers>
       <rewrite>
         <rules>
           <rule name="NodeInspector" patternSyntax="ECMAScript" stopProcessing="true">
             <match url="^dist/index.js\/debug[\/]?" />
           </rule>
           <rule name="StaticContent">
             <action type="Rewrite" url="public{REQUEST_URI}"/>
           </rule>
           <rule name="DynamicContent">
             <conditions>
               <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="True"/>
             </conditions>
             <action type="Rewrite" url="dist/index.js"/>
           </rule>
         </rules>
       </rewrite>
       <security>
         <requestFiltering>
           <hiddenSegments>
             <add segment="node_modules"/>
           </hiddenSegments>
         </requestFiltering>
       </security>
       <iisnode node_env="production" />
     </system.webServer>
   </configuration>
   ```

3. **Create IIS Website**:
   - Open IIS Manager
   - Right-click **Sites** → **Add Website**
   - Site name: `TaskTrackerAPI`
   - Physical path: `C:\inetpub\task-tracker\server`
   - Port: `3001`
   - Click **OK**

4. **Build Backend**:
   ```powershell
   cd C:\inetpub\task-tracker\server
   npm run build
   ```

#### Setup Frontend with IIS

1. **Create IIS Website for Frontend**:
   - Open IIS Manager
   - Right-click **Sites** → **Add Website**
   - Site name: `TaskTrackerFrontend`
   - Physical path: `C:\inetpub\task-tracker\dist`
   - Port: `80` (or `443` for HTTPS)
   - Click **OK**

2. **Configure URL Rewrite** (for React Router):
   
   Create `web.config` in `dist` folder:
   ```xml
   <?xml version="1.0" encoding="UTF-8"?>
   <configuration>
     <system.webServer>
       <rewrite>
         <rules>
           <rule name="React Routes" stopProcessing="true">
             <match url=".*" />
             <conditions logicalGrouping="MatchAll">
               <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true" />
               <add input="{REQUEST_FILENAME}" matchType="IsDirectory" negate="true" />
             </conditions>
             <action type="Rewrite" url="/" />
           </rule>
         </rules>
       </rewrite>
       <staticContent>
         <mimeMap fileExtension=".json" mimeType="application/json" />
         <mimeMap fileExtension=".woff" mimeType="application/font-woff" />
         <mimeMap fileExtension=".woff2" mimeType="application/font-woff2" />
       </staticContent>
     </system.webServer>
   </configuration>
   ```

### Option 2: PM2 (Recommended for Node.js)

PM2 is a production process manager for Node.js applications.

#### Install PM2

```powershell
npm install -g pm2
npm install -g pm2-windows-service
```

#### Create PM2 Ecosystem File

Create `ecosystem.config.js` in project root:

```javascript
module.exports = {
  apps: [
    {
      name: 'task-tracker-api',
      script: './server/dist/index.js',
      cwd: './server',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm Z',
      merge_logs: true,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G'
    }
  ]
};
```

#### Start Application with PM2

```powershell
cd C:\inetpub\task-tracker

# Build backend
cd server
npm run build
cd ..

# Start with PM2
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 as Windows Service (run as Administrator)
pm2-service-install -n PM2

# Start the service
pm2-service-start
```

#### PM2 Commands

```powershell
# View status
pm2 status

# View logs
pm2 logs task-tracker-api

# Restart application
pm2 restart task-tracker-api

# Stop application
pm2 stop task-tracker-api

# Monitor
pm2 monit
```

#### Setup Frontend with IIS (same as Option 1)

Use IIS to serve the static frontend files from `dist` folder.

## SSL/HTTPS Configuration

### Using Let's Encrypt (Free)

1. **Install win-acme**:
   ```powershell
   # Download from https://github.com/win-acme/win-acme/releases
   # Extract to C:\win-acme
   ```

2. **Request Certificate**:
   ```powershell
   cd C:\win-acme
   .\wacs.exe
   ```
   
   Follow prompts to:
   - Select IIS website
   - Validate domain ownership
   - Install certificate

3. **Configure HTTPS Binding in IIS**:
   - Open IIS Manager
   - Select your website
   - Click **Bindings** → **Add**
   - Type: `https`
   - Port: `443`
   - SSL certificate: Select the Let's Encrypt certificate
   - Click **OK**

### Using Commercial SSL Certificate

1. **Purchase SSL Certificate** from provider (DigiCert, Comodo, etc.)
2. **Import Certificate** to Windows Certificate Store
3. **Bind to IIS Website** in Site Bindings

## Backend API Configuration for Production

Update `server/src/index.ts` CORS settings:

```typescript
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'https://yourdomain.com',
  credentials: true
}));
```

## Frontend API URL Configuration

Update frontend to use production API URL.

Create `src/config.ts`:

```typescript
export const API_BASE_URL = import.meta.env.PROD 
  ? 'https://api.yourdomain.com'  // Production API
  : 'http://localhost:3001';       // Development API
```

Update all API calls in `src/services/*.ts` to use `API_BASE_URL`.

Rebuild frontend:
```powershell
npm run build
```

## Monitoring and Maintenance

### SQL Server Maintenance

#### Enable SQL Server Agent (for automated backups)

```sql
-- Set up daily backup job
USE msdb;
GO

EXEC sp_add_job @job_name = 'TaskTracker_Backup';

EXEC sp_add_jobstep
  @job_name = 'TaskTracker_Backup',
  @step_name = 'Backup Database',
  @subsystem = 'TSQL',
  @command = '
    BACKUP DATABASE TaskTracker
    TO DISK = ''C:\Backups\TaskTracker_'' + CONVERT(VARCHAR, GETDATE(), 112) + ''.bak''
    WITH FORMAT, COMPRESSION;
  ';

EXEC sp_add_schedule
  @schedule_name = 'Daily_2AM',
  @freq_type = 4,  -- Daily
  @freq_interval = 1,
  @active_start_time = 020000;  -- 2:00 AM

EXEC sp_attach_schedule
  @job_name = 'TaskTracker_Backup',
  @schedule_name = 'Daily_2AM';

EXEC sp_add_jobserver @job_name = 'TaskTracker_Backup';
```

#### Monitoring Queries

```sql
-- Check database size
SELECT 
  DB_NAME() as DatabaseName,
  ROUND(SUM(size) * 8.0 / 1024, 2) as SizeMB
FROM sys.database_files;

-- Check active connections
SELECT 
  DB_NAME(dbid) as DatabaseName,
  COUNT(dbid) as NumberOfConnections
FROM sys.sysprocesses
WHERE dbid > 0
GROUP BY dbid;

-- Check long-running queries
SELECT 
  r.session_id,
  r.start_time,
  r.status,
  r.command,
  SUBSTRING(t.text, (r.statement_start_offset/2)+1,
    ((CASE r.statement_end_offset
      WHEN -1 THEN DATALENGTH(t.text)
      ELSE r.statement_end_offset
    END - r.statement_start_offset)/2) + 1) AS query_text
FROM sys.dm_exec_requests r
CROSS APPLY sys.dm_exec_sql_text(r.sql_handle) t
WHERE r.session_id != @@SPID;
```

### Application Monitoring

#### PM2 Monitoring

```powershell
# Install PM2 monitoring dashboard
pm2 install pm2-server-monit

# View dashboard
pm2 web
```

#### Windows Performance Monitor

Monitor these counters:
- Processor → % Processor Time
- Memory → Available MBytes
- SQL Server → Buffer Manager → Page life expectancy
- Network Interface → Bytes Total/sec

### Log Rotation

Configure log rotation in PM2 ecosystem file:

```javascript
pm2_logrotate: {
  max_size: '10M',
  retain: 30,
  compress: true
}
```

## Security Hardening

### SQL Server Security

```sql
-- Disable xp_cmdshell (if not needed)
EXEC sp_configure 'xp_cmdshell', 0;
RECONFIGURE;

-- Enable encryption
ALTER DATABASE TaskTracker SET ENCRYPTION ON;

-- Audit failed logins
CREATE SERVER AUDIT LoginAudit
TO FILE (FILEPATH = 'C:\SQLAudit\');

ALTER SERVER AUDIT LoginAudit WITH (STATE = ON);
```

### Windows Firewall Rules

```powershell
# Block all except necessary ports
Set-NetFirewallProfile -Profile Domain,Public,Private -DefaultInboundAction Block -DefaultOutboundAction Allow

# Allow only specific IPs to SQL Server (optional)
New-NetFirewallRule -DisplayName "SQL Server - Specific IP" -Direction Inbound -Protocol TCP -LocalPort 1433 -RemoteAddress 192.168.1.100 -Action Allow
```

### Regular Updates

```powershell
# Update Windows
Install-Module PSWindowsUpdate
Get-WindowsUpdate
Install-WindowsUpdate -AcceptAll -AutoReboot

# Update Node.js packages
cd C:\inetpub\task-tracker
npm audit
npm audit fix

cd server
npm audit
npm audit fix
```

## Troubleshooting

### Backend Not Starting

Check PM2 logs:
```powershell
pm2 logs task-tracker-api --lines 100
```

Common issues:
- Port already in use: Change PORT in .env
- Database connection failed: Check SQL Server is running and credentials are correct
- Module not found: Run `npm install` in server folder

### SQL Server Connection Issues

```powershell
# Test connection
sqlcmd -S localhost -U TaskTrackerApp -P YourVeryStrong@Password123! -Q "SELECT @@VERSION"
```

If connection fails:
1. Check SQL Server service is running
2. Verify TCP/IP is enabled
3. Check firewall rules
4. Verify credentials

### High Memory Usage

```sql
-- Clear SQL Server cache (dev/test only)
DBCC DROPCLEANBUFFERS;
DBCC FREEPROCCACHE;

-- Check memory usage
SELECT 
  (physical_memory_in_use_kb/1024) AS Memory_Used_MB,
  (locked_page_allocations_kb/1024) AS Locked_Pages_MB,
  (total_virtual_address_space_kb/1024) AS Total_VAS_MB
FROM sys.dm_os_process_memory;
```

## Backup and Recovery

### Manual Backup

```sql
-- Full backup
BACKUP DATABASE TaskTracker
TO DISK = 'C:\Backups\TaskTracker_Manual.bak'
WITH FORMAT, COMPRESSION;

-- Backup with retention
BACKUP DATABASE TaskTracker
TO DISK = 'C:\Backups\TaskTracker_<< YourDateTime >>.bak'
WITH COMPRESSION, COPY_ONLY;
```

### Restore from Backup

```sql
-- Check backup contents
RESTORE FILELISTONLY FROM DISK = 'C:\Backups\TaskTracker.bak';

-- Restore database
USE master;
ALTER DATABASE TaskTracker SET SINGLE_USER WITH ROLLBACK IMMEDIATE;

RESTORE DATABASE TaskTracker
FROM DISK = 'C:\Backups\TaskTracker.bak'
WITH REPLACE;

ALTER DATABASE TaskTracker SET MULTI_USER;
```

## Performance Optimization

### Database Optimization

```sql
-- Update statistics
UPDATE STATISTICS tasks WITH FULLSCAN;
UPDATE STATISTICS projects WITH FULLSCAN;
UPDATE STATISTICS users WITH FULLSCAN;

-- Rebuild indexes
ALTER INDEX ALL ON tasks REBUILD;
ALTER INDEX ALL ON projects REBUILD;
ALTER INDEX ALL ON users REBUILD;

-- Check for missing indexes
SELECT 
  CONVERT(decimal(18,2), user_seeks * avg_total_user_cost * (avg_user_impact * 0.01)) AS improvement_measure,
  'CREATE INDEX IX_' + OBJECT_NAME(mid.object_id, mid.database_id) + '_'
    + REPLACE(REPLACE(REPLACE(ISNULL(mid.equality_columns,''), ', ', '_'), '[', ''), ']', '') AS index_name,
  mid.equality_columns,
  mid.inequality_columns,
  mid.included_columns
FROM sys.dm_db_missing_index_details mid
INNER JOIN sys.dm_db_missing_index_groups mig ON mid.index_handle = mig.index_handle
INNER JOIN sys.dm_db_missing_index_group_stats migs ON mig.index_group_handle = migs.group_handle
WHERE CONVERT(decimal(18,2), user_seeks * avg_total_user_cost * (avg_user_impact * 0.01)) > 10
ORDER BY improvement_measure DESC;
```

### Connection Pooling

Already configured in `server/src/db/pool.ts`:
- Max connections: 10
- Idle timeout: 30 seconds
- Connection encryption for production

## Scaling Considerations

### Vertical Scaling
- Increase VPS RAM (8GB → 16GB → 32GB)
- Add more CPU cores
- Upgrade SQL Server edition (Express → Standard → Enterprise)

### Horizontal Scaling
- Use Application Request Routing (ARR) in IIS for load balancing
- Deploy multiple Node.js instances with PM2 cluster mode
- Use SQL Server Always On Availability Groups for high availability

### Caching
Consider adding Redis or SQL Server caching:
```typescript
// Add redis dependency
npm install redis

// Configure in-memory caching for frequent queries
import { createClient } from 'redis';
const redis = createClient({ url: 'redis://localhost:6379' });
```

## Cost Optimization

### SQL Server Express Limitations
- Database size: 10GB maximum
- Memory: 1GB maximum
- CPU: Lesser of 1 socket or 4 cores

Upgrade to Standard if you exceed these limits.

### VPS Provider Recommendations
- **AWS EC2**: t3.medium or larger for Windows Server
- **Azure**: B2s or larger for combined workload
- **DigitalOcean**: Not recommended (Linux-focused)
- **Vultr**: High Frequency Compute, Windows Server

## Support and Resources

- **SQL Server Documentation**: https://docs.microsoft.com/en-us/sql/
- **IIS Documentation**: https://docs.microsoft.com/en-us/iis/
- **PM2 Documentation**: https://pm2.keymetrics.io/docs/
- **Node.js Best Practices**: https://github.com/goldbergyoni/nodebestpractices

## Deployment Checklist

Final checklist before going live:

- [ ] SQL Server installed and secured
- [ ] Database created and migrated
- [ ] Environment variables configured (production values)
- [ ] JWT_SECRET changed to random string
- [ ] Application built and deployed
- [ ] PM2 or IIS configured and running
- [ ] Firewall rules configured
- [ ] SSL certificate installed
- [ ] CORS configured for production domain
- [ ] Automated backups scheduled
- [ ] Monitoring configured
- [ ] Admin user created
- [ ] Test all critical features
- [ ] Document server credentials securely
