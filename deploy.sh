#!/bin/bash

echo "========================================="
echo "  Task Tracker - VPS Deployment Script"
echo "========================================="
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Change to app directory
APP_DIR="/var/www/task-tracker"
cd $APP_DIR || { echo -e "${RED}Error: Cannot access $APP_DIR${NC}"; exit 1; }

# Pull latest changes (if using Git)
echo -e "${YELLOW}Pulling latest changes...${NC}"
if [ -d .git ]; then
    git pull origin main || { echo -e "${RED}Git pull failed${NC}"; exit 1; }
else
    echo "Not a git repository, skipping pull"
fi

# Install dependencies
echo ""
echo -e "${YELLOW}Installing dependencies...${NC}"
npm install || { echo -e "${RED}Frontend npm install failed${NC}"; exit 1; }
cd server && npm install || { echo -e "${RED}Backend npm install failed${NC}"; exit 1; }
cd ..

# Build application
echo ""
echo -e "${YELLOW}Building frontend...${NC}"
npm run build || { echo -e "${RED}Frontend build failed${NC}"; exit 1; }

echo ""
echo -e "${YELLOW}Building backend...${NC}"
cd server && npm run build || { echo -e "${RED}Backend build failed${NC}"; exit 1; }
cd ..

# Run migrations (optional, uncomment if needed)
# echo ""
# echo -e "${YELLOW}Running database migrations...${NC}"
# cd server && npm run migrate || { echo -e "${RED}Migration failed${NC}"; exit 1; }
# cd ..

# Restart application
echo ""
echo -e "${YELLOW}Restarting application...${NC}"
pm2 restart task-tracker || { echo -e "${RED}PM2 restart failed${NC}"; exit 1; }

# Save PM2 state
pm2 save

# Check application status
echo ""
echo -e "${GREEN}=========================================${NC}"
echo -e "${GREEN}  Deployment Complete!${NC}"
echo -e "${GREEN}=========================================${NC}"
echo ""
pm2 status
echo ""
echo "Application URL: https://tasks.yourdomain.com"
echo "Health Check: https://tasks.yourdomain.com/api/health"
echo ""
echo "View logs with: pm2 logs task-tracker"
