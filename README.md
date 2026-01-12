# Task Tracker Application

A dual-timesheet task tracking application with **multi-user support** for managing work and personal tasks with time tracking, notifications, and Excel export capabilities.

## 🚀 Features

### Core Functionality
- ✅ **Dual Timesheet System**
  - Work Timesheet (Monday-Thursday active, Fri-Sun off)
  - Personal Timesheet (All 7 days active)
- ✅ **Multi-User Support** with role-based access control
- ✅ **Authentication** - JWT-based secure login/registration
- ✅ **Admin Dashboard** - User management and analytics
- ✅ **Project Management** - Organize tasks by projects with color coding
- ✅ **Time Tracking** - Track start/end times or manual duration entry
- ✅ **Task Status** - Pending, In Progress, Completed
- ✅ **Notifications** - Daily end-of-day reminders
- ✅ **Excel Export** - Export tasks with date range filtering
- ✅ **Data Persistence** - SQL Server database for reliable storage

### User Roles
- **Admin**: Full access to all users' data, user management, system analytics
- **User**: Access to own tasks, projects, and settings

## 🏗️ Technology Stack

### Frontend
- **React 19** with TypeScript
- **Vite** for fast development
- **Material-UI** (@mui/material) for UI components
- **React Router DOM v7** for navigation
- **React Hook Form** for form validation
- **date-fns** for date utilities
- **Recharts** for data visualization
- **xlsx** for Excel export

### Backend
- **Node.js** with Express
- **TypeScript** for type safety
- **SQL Server** database (supports Express, Standard, Enterprise editions)
- **mssql** driver for SQL Server connectivity
- **JWT** (jsonwebtoken) for authentication
- **bcryptjs** for password hashing

## 📋 Prerequisites

- **Node.js** 18+ LTS
- **SQL Server** 2016 or later (Express, Standard, or Enterprise)
- **Windows** (for SQL Server)
- **SQL Server Management Studio (SSMS)** recommended for database management

## 🚀 Quick Start

See [QUICKSTART.md](QUICKSTART.md) for a 5-minute setup guide.

### 1. Install SQL Server

If not already installed, download [SQL Server Express](https://www.microsoft.com/en-us/sql-server/sql-server-downloads) (free) and install with Mixed Mode Authentication.

### 2. Clone and Install

```bash
# Clone repository
git clone <your-repo-url>
cd task-tracker-app

# Install frontend dependencies
npm install

# Install backend dependencies
cd server
npm install
```

### 3. Configure Database

Create `server/.env`:

```env
PORT=3001
NODE_ENV=development

DB_SERVER=localhost\SQLEXPRESS
DB_DATABASE=TaskTracker
DB_USER=sa
DB_PASSWORD=YourStrong@Password

JWT_SECRET=your-secret-key-change-this-in-production
```

### 4. Create Database and Run Migration

```bash
# Create database (in SSMS or sqlcmd)
sqlcmd -S localhost\SQLEXPRESS -U sa -P YourPassword -Q "CREATE DATABASE TaskTracker"

# Run migration
cd server
npm run migrate
```

### 5. Start Application

```bash
# Terminal 1: Start backend
cd server
npm run dev

# Terminal 2: Start frontend
cd ..
npm run dev
```

Access the application at: **http://localhost:5173**

## 📚 Documentation

- **[QUICKSTART.md](QUICKSTART.md)** - Fast 5-minute setup guide
- **[LOCAL_SETUP.md](LOCAL_SETUP.md)** - Detailed local development guide
- **[VPS_DEPLOYMENT.md](VPS_DEPLOYMENT.md)** - Production deployment on Windows VPS

## 🔧 Development

### Project Structure

```
task-tracker-app/
├── src/                      # Frontend React application
│   ├── components/           # Reusable UI components
│   ├── pages/                # Route-level pages
│   ├── services/             # Business logic & API calls
│   ├── types/                # TypeScript interfaces
│   ├── utils/                # Helper functions
│   └── contexts/             # React Context providers
├── server/                   # Backend Node.js application
│   ├── src/
│   │   ├── routes/           # API endpoints
│   │   ├── middleware/       # Auth & validation middleware
│   │   └── db/               # Database connection & migration
│   └── .env                  # Environment configuration
└── public/                   # Static assets
```

### Available Scripts

#### Frontend
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

#### Backend
```bash
npm run dev          # Start with nodemon (auto-reload)
npm run build        # Compile TypeScript
npm start            # Start production server
npm run migrate      # Run database migrations
```

## 🗃️ Database Schema

### Tables
- **users** - User accounts with roles (admin/user)
- **projects** - Project definitions with type and color
- **tasks** - Task entries with time tracking
- **notification_settings** - User notification preferences

See [QUICKSTART.md](QUICKSTART.md) for detailed schema.

## 🔐 Authentication

The application uses JWT (JSON Web Tokens) for authentication:

1. **Register**: POST `/api/auth/register` with email, password, name
2. **Login**: POST `/api/auth/login` to receive JWT token
3. **Protected Routes**: Include token in `Authorization: Bearer <token>` header

## 🌐 API Endpoints

### Public
- `POST /api/auth/register` - Create new account
- `POST /api/auth/login` - Login and get token

### User (Requires Authentication)
- `GET /api/tasks` - List user's tasks
- `POST /api/tasks` - Create task
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task
- `GET /api/projects` - List projects
- `POST /api/projects` - Create project
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

### Admin (Requires Admin Role)
- `GET /api/admin/users` - List all users
- `GET /api/admin/users/:userId/stats` - User statistics
- `GET /api/admin/users/:userId/tasks` - User's task list
- `GET /api/admin/tasks/all` - All tasks overview
- `PATCH /api/admin/users/:userId/role` - Update user role

## 🎨 Features in Detail

### Dual Timesheet System
- **Work Timesheet**: Active Monday-Thursday, OFF Friday-Sunday
- **Personal Timesheet**: Active all 7 days
- Tasks are filtered by type automatically

### Time Tracking
- Manual duration entry (in minutes)
- Start/End time tracking with automatic duration calculation
- Duration displayed in HH:MM format

### Excel Export
- Export tasks with date range filtering
- Include project information
- Optional statistics sheet

### Notifications
- Browser notification support
- Daily end-of-day reminders
- Configurable notification time per user

## 🚀 Deployment

### Local Deployment
See [LOCAL_SETUP.md](LOCAL_SETUP.md) for complete local setup instructions.

### VPS Deployment
See [VPS_DEPLOYMENT.md](VPS_DEPLOYMENT.md) for production deployment guide covering:
- SQL Server configuration
- IIS or PM2 setup
- SSL/HTTPS configuration
- Security hardening
- Monitoring and backups

## 🔒 Security

- Passwords hashed with bcrypt (10 rounds)
- JWT tokens with 7-day expiry
- SQL injection prevention via parameterized queries
- CORS configuration for API access
- Role-based access control

## 🐛 Troubleshooting

### Common Issues

**Cannot connect to SQL Server**
```bash
# Check if SQL Server is running
Get-Service -Name 'MSSQL$SQLEXPRESS'

# Start if stopped
Start-Service -Name 'MSSQL$SQLEXPRESS'
```

**Login failed for user 'sa'**
- Enable Mixed Mode Authentication in SQL Server
- Verify sa account is enabled
- Check password matches .env file

**Database does not exist**
```sql
CREATE DATABASE TaskTracker;
```

See [LOCAL_SETUP.md](LOCAL_SETUP.md) for more troubleshooting tips.

## 📝 Environment Variables

### Development (.env)
```env
PORT=3001
NODE_ENV=development
DB_SERVER=localhost\SQLEXPRESS
DB_DATABASE=TaskTracker
DB_USER=sa
DB_PASSWORD=YourStrong@Password
JWT_SECRET=dev-secret-key
```

### Production
```env
PORT=3001
NODE_ENV=production
DB_SERVER=localhost
DB_DATABASE=TaskTracker
DB_USER=TaskTrackerApp
DB_PASSWORD=YourVeryStrong@Password123!
JWT_SECRET=<64-char-random-string>
CORS_ORIGIN=https://yourdomain.com
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- Material-UI for the component library
- Dexie.js team (previously used for IndexedDB)
- React and TypeScript communities
- Microsoft SQL Server team

## 📞 Support

For issues and questions:
- Check [QUICKSTART.md](QUICKSTART.md) for quick setup
- See [LOCAL_SETUP.md](LOCAL_SETUP.md) for detailed troubleshooting
- Review [VPS_DEPLOYMENT.md](VPS_DEPLOYMENT.md) for deployment help

## 🗺️ Roadmap

- [ ] Dark mode support
- [ ] Mobile app (React Native)
- [ ] Calendar view
- [ ] Task comments and attachments
- [ ] Email notifications
- [ ] Team collaboration features
- [ ] REST API documentation (Swagger)
- [ ] Docker containerization
- [ ] Azure SQL Database support

---

**Built with ❤️ using React, TypeScript, and SQL Server**
