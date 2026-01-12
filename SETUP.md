# Task Tracker - Multi-User Application

A complete task tracking application with user authentication and persistent database storage.

## Architecture

### Backend
- **Node.js + Express** - REST API server
- **PostgreSQL** - Relational database for persistent storage
- **JWT** - Token-based authentication
- **bcrypt** - Password hashing

### Frontend
- **React 19 + TypeScript**
- **Material-UI** - Modern UI components
- **React Router** - Client-side routing
- **Context API** - Authentication state management

## Prerequisites

1. **Node.js** (v18 or higher) - Already installed ✅
2. **PostgreSQL** (v12 or higher) - **REQUIRED**

## PostgreSQL Installation

### Windows
1. Download PostgreSQL from: https://www.postgresql.org/download/windows/
2. Run the installer and follow the wizard
3. Set a password for the `postgres` user (remember this!)
4. Default port: 5432
5. Add PostgreSQL to your PATH:
   - The installer usually adds: `C:\Program Files\PostgreSQL\16\bin`

### After Installation
1. Verify PostgreSQL is running:
   ```powershell
   psql --version
   ```

2. Connect to PostgreSQL:
   ```powershell
   psql -U postgres
   ```

3. Create the database:
   ```sql
   CREATE DATABASE task_tracker;
   \q
   ```

## Setup Instructions

### 1. Configure Database Connection

Edit `server/.env` with your PostgreSQL credentials:

```env
PORT=3001
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/task_tracker
JWT_SECRET=your-secret-key-change-this-in-production
NODE_ENV=development
```

**Replace `YOUR_PASSWORD` with your PostgreSQL password!**

### 2. Run Database Migration

```powershell
cd server
npm run migrate
```

This creates all necessary tables (users, projects, tasks, notification_settings).

### 3. Start the Backend Server

```powershell
cd server
npm run dev
```

Server will start on `http://localhost:3001`

### 4. Start the Frontend

In a new terminal:

```powershell
npm run dev
```

Frontend will start on `http://localhost:5173`

## First Time Usage

1. Navigate to `http://localhost:5173`
2. You'll be redirected to the login page
3. Click "Sign up" to create an account
4. The first user you create will be a regular user
5. To make a user an admin, you need to update the database directly:

```sql
psql -U postgres -d task_tracker
UPDATE users SET role = 'admin' WHERE email = 'your-email@example.com';
```

## Features

### For All Users
- ✅ Create and manage personal tasks
- ✅ Create and manage work tasks
- ✅ Organize tasks by projects
- ✅ Track time with start/end times
- ✅ Mark tasks as completed
- ✅ Export tasks to Excel
- ✅ Import tasks from Excel
- ✅ Work/Personal separate timesheets
- ✅ Dashboard with statistics
- ✅ Browser notifications

### For Admins
- ✅ View all users
- ✅ View each user's tasks and statistics
- ✅ See total tasks/projects across all users
- ✅ View user activity

## API Endpoints

### Authentication
- `POST /api/auth/register` - Create new user
- `POST /api/auth/login` - Login user

### Tasks (Protected)
- `GET /api/tasks` - Get all tasks for current user
- `POST /api/tasks` - Create new task
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task

### Projects (Protected)
- `GET /api/projects` - Get all projects for current user
- `POST /api/projects` - Create new project
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

### Admin (Admin Only)
- `GET /api/admin/users` - Get all users
- `GET /api/admin/users/:userId/stats` - Get user statistics
- `GET /api/admin/users/:userId/tasks` - Get user's tasks
- `GET /api/admin/tasks/all` - Get all tasks (overview)
- `PATCH /api/admin/users/:userId/role` - Update user role

## Project Structure

```
task-tracker-app/
├── server/                  # Backend API
│   ├── src/
│   │   ├── db/
│   │   │   ├── pool.ts     # Database connection
│   │   │   └── migrate.ts  # Database schema
│   │   ├── middleware/
│   │   │   └── auth.ts     # JWT authentication
│   │   ├── routes/
│   │   │   ├── auth.ts     # Auth endpoints
│   │   │   ├── tasks.ts    # Task endpoints
│   │   │   ├── projects.ts # Project endpoints
│   │   │   └── admin.ts    # Admin endpoints
│   │   └── index.ts        # Express app
│   ├── package.json
│   └── .env
├── src/                     # Frontend React app
│   ├── components/         # Reusable components
│   ├── contexts/           # React contexts (Auth)
│   ├── pages/              # Page components
│   ├── services/           # API client, database
│   ├── types/              # TypeScript types
│   └── App.tsx             # Main app with routing
└── package.json
```

## Security Notes

1. **Change JWT_SECRET** in production to a random string
2. **Use HTTPS** in production
3. **Never commit .env files** to version control
4. **Use environment variables** for all secrets
5. **Validate all inputs** on both client and server

## Troubleshooting

### "Connection refused" error
- Make sure PostgreSQL service is running
- Check if port 5432 is available
- Verify DATABASE_URL in server/.env

### "Cannot find module" errors
- Run `npm install` in both root and server directories
- Delete node_modules and package-lock.json, then reinstall

### "CORS" errors
- Make sure backend is running on port 3001
- Check VITE_API_URL in frontend .env

### Migration fails
- Check PostgreSQL connection
- Verify database exists: `CREATE DATABASE task_tracker;`
- Check user has permissions

## Development

### Backend (port 3001)
```powershell
cd server
npm run dev  # Auto-restarts on file changes
```

### Frontend (port 5173)
```powershell
npm run dev  # Hot module reload enabled
```

### Build for Production
```powershell
# Frontend
npm run build

# Backend
cd server
npm run build
npm start
```

## Database Schema

### users
- id (serial, primary key)
- email (unique, not null)
- password (hashed, not null)
- name (not null)
- role ('user' | 'admin')
- created_at (timestamp)

### projects
- id (serial, primary key)
- name (not null)
- color (not null)
- type ('work' | 'personal')
- user_id (foreign key → users)
- created_at (timestamp)

### tasks
- id (serial, primary key)
- title (not null)
- description (text)
- type ('work' | 'personal')
- project_id (foreign key → projects)
- user_id (foreign key → users)
- date (date, not null)
- start_time (time)
- end_time (time)
- duration (integer, minutes)
- status ('pending' | 'completed')
- created_at (timestamp)

### notification_settings
- id (serial, primary key)
- user_id (unique, foreign key → users)
- enabled (boolean)
- time (varchar)
- created_at (timestamp)

## Support

For issues or questions, check:
1. PostgreSQL is installed and running
2. Environment variables are correct
3. Ports 3001 and 5173 are available
4. Both frontend and backend are running
