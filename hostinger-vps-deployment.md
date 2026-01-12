# Hostinger VPS Deployment Guide - Task Tracker App

Complete guide to deploy your Task Tracker application on Hostinger VPS with Nginx and subdomain.

---

## 📋 Prerequisites

- ✅ Hostinger VPS with Ubuntu/Debian
- ✅ Root or sudo access
- ✅ Domain name (e.g., yourdomain.com)
- ✅ Subdomain DNS configured (e.g., tasks.yourdomain.com)
- ✅ Nginx installed on VPS
- ✅ SQL Server database (local or remote)

---

## 🎯 Architecture Overview

```
Internet → Nginx (Port 80/443)
            ↓
         Reverse Proxy
            ↓
    Node.js Backend (Port 3001)
            ↓
    Serves React Frontend (built files)
            ↓
    SQL Server Database
```

---

## Part 1: VPS Initial Setup

### 1. Connect to VPS
```bash
ssh root@your-vps-ip
# Or use Hostinger's web terminal
```

### 2. Update System
```bash
sudo apt update && sudo apt upgrade -y
```

### 3. Install Node.js (v18 or higher)
```bash
# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version
npm --version
```

### 4. Install PM2 (Process Manager)
```bash
sudo npm install -g pm2

# Enable PM2 to start on boot
pm2 startup systemd
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u $USER --hp $HOME
```

### 5. Install Git
```bash
sudo apt install git -y
```

---

## Part 2: Database Setup

### Option A: SQL Server on VPS

```bash
# Install SQL Server on Ubuntu
wget -qO- https://packages.microsoft.com/keys/microsoft.asc | sudo apt-key add -
sudo add-apt-repository "$(wget -qO- https://packages.microsoft.com/config/ubuntu/20.04/mssql-server-2022.list)"
sudo apt update
sudo apt install -y mssql-server

# Configure SQL Server
sudo /opt/mssql/bin/mssql-conf setup

# Install SQL Server command-line tools
curl https://packages.microsoft.com/keys/microsoft.asc | sudo apt-key add -
curl https://packages.microsoft.com/config/ubuntu/20.04/prod.list | sudo tee /etc/apt/sources.list.d/msprod.list
sudo apt update
sudo apt install -y mssql-tools unixodbc-dev

# Add tools to PATH
echo 'export PATH="$PATH:/opt/mssql-tools/bin"' >> ~/.bashrc
source ~/.bashrc

# Create database
sqlcmd -S localhost -U SA -P 'YourStrongPassword123!'
> CREATE DATABASE [task-manager];
> GO
> CREATE LOGIN [taskuser01] WITH PASSWORD = 'StrongPassword@123';
> GO
> USE [task-manager];
> GO
> CREATE USER [taskuser01] FOR LOGIN [taskuser01];
> GO
> ALTER ROLE db_owner ADD MEMBER [taskuser01];
> GO
> EXIT
```

### Option B: Remote SQL Server Connection

If your SQL Server is on your local Windows machine, you'll need to:
1. Open firewall port 1433 on Windows
2. Configure SQL Server for remote connections
3. Use your public IP or VPN

---

## Part 3: Deploy Application

### 1. Clone Repository
```bash
# Create app directory
sudo mkdir -p /var/www/task-tracker
sudo chown -R $USER:$USER /var/www/task-tracker
cd /var/www/task-tracker

# Option A: Clone from Git (if you have a repo)
git clone https://github.com/yourusername/task-tracker-app.git .

# Option B: Upload files manually using SCP/SFTP
# From your Windows machine:
# scp -r C:\Users\afekry\task-tracker-app root@your-vps-ip:/var/www/task-tracker/
```

### 2. Install Dependencies

**Frontend:**
```bash
npm install
```

**Backend:**
```bash
cd server
npm install
cd ..
```

### 3. Configure Environment

**Create production .env file:**
```bash
nano server/.env
```

**Add configuration:**
```env
PORT=3001
NODE_ENV=production

# SQL Server Configuration
DB_SERVER=localhost
# Or use your remote SQL Server IP
# DB_SERVER=your-windows-ip
DB_PORT=1433
DB_DATABASE=task-manager
DB_USER=taskuser01
DB_PASSWORD=StrongPassword@123

# Security
JWT_SECRET=generate-a-secure-random-string-here-change-this-123456789

# CORS (use your subdomain)
ALLOWED_ORIGINS=https://tasks.yourdomain.com,https://yourdomain.com
```

**Generate secure JWT secret:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 4. Build Application

**Build Frontend:**
```bash
npm run build
```

**Build Backend:**
```bash
cd server
npm run build
cd ..
```

### 5. Run Database Migration
```bash
cd server
npm run migrate
cd ..
```

---

## Part 4: Nginx Configuration

### 1. Create Nginx Configuration
```bash
sudo nano /etc/nginx/sites-available/task-tracker
```

**Add this configuration:**
```nginx
# Redirect HTTP to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name tasks.yourdomain.com;
    
    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

# HTTPS Configuration
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name tasks.yourdomain.com;

    # SSL Configuration (will be configured by Certbot)
    ssl_certificate /etc/letsencrypt/live/tasks.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/tasks.yourdomain.com/privkey.pem;
    
    # SSL Security Settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Logs
    access_log /var/log/nginx/task-tracker-access.log;
    error_log /var/log/nginx/task-tracker-error.log;

    # Client body size (for file uploads)
    client_max_body_size 10M;

    # API Proxy
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Static Files (React App)
    location / {
        root /var/www/task-tracker/dist;
        try_files $uri $uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
}
```

### 2. Enable Site
```bash
# Create symbolic link
sudo ln -s /etc/nginx/sites-available/task-tracker /etc/nginx/sites-enabled/

# Test Nginx configuration
sudo nginx -t

# If test passes, reload Nginx
sudo systemctl reload nginx
```

---

## Part 5: SSL Certificate Setup

### 1. Install Certbot
```bash
sudo apt install certbot python3-certbot-nginx -y
```

### 2. Obtain SSL Certificate
```bash
# Make sure DNS is configured first!
sudo certbot --nginx -d tasks.yourdomain.com

# Follow prompts:
# - Enter email address
# - Agree to terms
# - Redirect HTTP to HTTPS: Yes
```

### 3. Auto-renewal Setup
```bash
# Test renewal
sudo certbot renew --dry-run

# Certbot automatically sets up cron job for renewal
sudo systemctl status certbot.timer
```

---

## Part 6: Start Application with PM2

### 1. Create PM2 Ecosystem File
```bash
nano ecosystem.config.js
```

**Add configuration:**
```javascript
module.exports = {
  apps: [{
    name: 'task-tracker',
    script: './server/dist/index.js',
    instances: 2,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    error_file: '/var/log/pm2/task-tracker-error.log',
    out_file: '/var/log/pm2/task-tracker-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    watch: false,
    max_memory_restart: '500M'
  }]
}
```

### 2. Start Application
```bash
# Create log directory
sudo mkdir -p /var/log/pm2
sudo chown -R $USER:$USER /var/log/pm2

# Start with PM2
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Check status
pm2 status
pm2 logs task-tracker
```

### 3. PM2 Commands
```bash
# View logs
pm2 logs task-tracker

# Restart app
pm2 restart task-tracker

# Stop app
pm2 stop task-tracker

# Monitor
pm2 monit

# View details
pm2 show task-tracker
```

---

## Part 7: DNS Configuration

### On Hostinger Dashboard:

1. **Go to DNS Management**
2. **Add A Record:**
   ```
   Type: A
   Name: tasks
   Value: Your-VPS-IP-Address
   TTL: 3600
   ```

3. **Wait for DNS propagation** (5-30 minutes)

4. **Verify DNS:**
   ```bash
   nslookup tasks.yourdomain.com
   dig tasks.yourdomain.com
   ```

---

## Part 8: Firewall Configuration

### Configure UFW (Ubuntu Firewall)
```bash
# Check status
sudo ufw status

# Allow SSH (important!)
sudo ufw allow 22/tcp

# Allow HTTP and HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Allow SQL Server (if using local DB)
sudo ufw allow 1433/tcp

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status verbose
```

---

## Part 9: Deployment Script

### Create deployment script for updates:
```bash
nano deploy.sh
chmod +x deploy.sh
```

**deploy.sh content:**
```bash
#!/bin/bash

echo "========================================="
echo "  Task Tracker - Deployment Script"
echo "========================================="
echo ""

# Change to app directory
cd /var/www/task-tracker || exit

# Pull latest changes (if using Git)
echo "Pulling latest changes..."
git pull origin main

# Install dependencies
echo "Installing dependencies..."
npm install
cd server && npm install && cd ..

# Build application
echo "Building application..."
npm run build
cd server && npm run build && cd ..

# Restart application
echo "Restarting application..."
pm2 restart task-tracker

echo ""
echo "========================================="
echo "  Deployment Complete!"
echo "========================================="
echo ""
pm2 status
```

**Usage:**
```bash
./deploy.sh
```

---

## Part 10: Monitoring & Maintenance

### Application Logs
```bash
# PM2 logs
pm2 logs task-tracker --lines 100

# Nginx access logs
sudo tail -f /var/log/nginx/task-tracker-access.log

# Nginx error logs
sudo tail -f /var/log/nginx/task-tracker-error.log

# System logs
journalctl -u nginx -f
```

### Backup Database
```bash
# Create backup script
nano backup-db.sh
chmod +x backup-db.sh
```

**backup-db.sh:**
```bash
#!/bin/bash
BACKUP_DIR="/var/backups/task-tracker"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

sqlcmd -S localhost -U SA -P 'YourStrongPassword123!' -Q "BACKUP DATABASE [task-manager] TO DISK = N'$BACKUP_DIR/task-manager-$DATE.bak' WITH NOFORMAT, NOINIT, NAME = 'Full Backup', SKIP, NOREWIND, NOUNLOAD, STATS = 10"

# Keep only last 7 days of backups
find $BACKUP_DIR -name "*.bak" -mtime +7 -delete

echo "Backup completed: $BACKUP_DIR/task-manager-$DATE.bak"
```

### Schedule Automated Backups
```bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * /var/www/task-tracker/backup-db.sh >> /var/log/backup.log 2>&1
```

### Monitor Resource Usage
```bash
# CPU and Memory
htop

# Disk space
df -h

# Network connections
netstat -tulpn | grep LISTEN

# PM2 monitoring
pm2 monit
```

---

## Part 11: Security Best Practices

### 1. Secure SSH
```bash
# Edit SSH config
sudo nano /etc/ssh/sshd_config

# Disable root login
PermitRootLogin no

# Change default port (optional)
Port 2222

# Restart SSH
sudo systemctl restart sshd
```

### 2. Keep System Updated
```bash
# Create update script
sudo nano /usr/local/bin/system-update.sh
```

**system-update.sh:**
```bash
#!/bin/bash
apt update && apt upgrade -y && apt autoremove -y
```

```bash
sudo chmod +x /usr/local/bin/system-update.sh

# Schedule weekly updates
sudo crontab -e
0 3 * * 0 /usr/local/bin/system-update.sh
```

### 3. Rate Limiting in Nginx
Add to your Nginx config:
```nginx
# Add before server block
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;

# Add inside location /api/
limit_req zone=api_limit burst=20 nodelay;
```

---

## Part 12: Testing

### 1. Test Application
```bash
# Test backend health
curl http://localhost:3001/api/health

# Test from outside
curl https://tasks.yourdomain.com/api/health
```

### 2. Test SSL
```bash
# Check SSL certificate
openssl s_client -connect tasks.yourdomain.com:443 -servername tasks.yourdomain.com

# Or use online tools
# https://www.ssllabs.com/ssltest/
```

### 3. Performance Test
```bash
# Install Apache Bench
sudo apt install apache2-utils -y

# Test API endpoint
ab -n 1000 -c 10 https://tasks.yourdomain.com/api/health
```

---

## Part 13: Troubleshooting

### Application Not Starting
```bash
# Check PM2 logs
pm2 logs task-tracker --err

# Check Node.js version
node --version

# Check if port 3001 is in use
sudo lsof -i :3001

# Restart PM2
pm2 restart all
```

### Nginx Errors
```bash
# Test Nginx config
sudo nginx -t

# Check Nginx status
sudo systemctl status nginx

# View error logs
sudo tail -f /var/log/nginx/error.log

# Restart Nginx
sudo systemctl restart nginx
```

### Database Connection Issues
```bash
# Test SQL Server connection
sqlcmd -S localhost -U taskuser01 -P 'StrongPassword@123' -d task-manager -Q "SELECT @@VERSION"

# Check if SQL Server is running
sudo systemctl status mssql-server

# View SQL Server logs
sudo tail -f /var/opt/mssql/log/errorlog
```

### SSL Certificate Issues
```bash
# Renew certificate manually
sudo certbot renew --force-renewal

# Check certificate expiry
sudo certbot certificates
```

---

## Quick Reference Commands

```bash
# Application Management
pm2 restart task-tracker    # Restart app
pm2 logs task-tracker       # View logs
pm2 monit                   # Monitor resources

# Nginx Management
sudo nginx -t               # Test config
sudo systemctl reload nginx # Reload config
sudo systemctl status nginx # Check status

# Database Management
sqlcmd -S localhost -U taskuser01 -P 'YourPass' -d task-manager
./backup-db.sh             # Run backup

# System Management
df -h                      # Check disk space
free -h                    # Check memory
htop                       # Process monitor

# Logs
pm2 logs                   # App logs
sudo tail -f /var/log/nginx/task-tracker-error.log  # Nginx errors
journalctl -xe             # System logs
```

---

## Post-Deployment Checklist

- [ ] Application accessible at https://tasks.yourdomain.com
- [ ] SSL certificate installed and working
- [ ] Database migrated successfully
- [ ] Can register new user
- [ ] Can login with user
- [ ] Can create tasks and projects
- [ ] PM2 configured to restart on system reboot
- [ ] Backups scheduled
- [ ] Firewall configured
- [ ] DNS configured correctly
- [ ] Nginx reverse proxy working
- [ ] Logs rotating properly
- [ ] Monitoring setup

---

## Support & Resources

- **Hostinger VPS Docs**: https://support.hostinger.com/
- **PM2 Documentation**: https://pm2.keymetrics.io/
- **Nginx Documentation**: https://nginx.org/en/docs/
- **Certbot Documentation**: https://certbot.eff.org/
- **SQL Server on Linux**: https://docs.microsoft.com/sql/linux/

---

**Deployment Date**: 2026-01-12
**Deployed By**: Task Tracker Team
**Environment**: Hostinger VPS + Nginx
