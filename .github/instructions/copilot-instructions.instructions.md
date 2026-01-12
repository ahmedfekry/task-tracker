# Task Tracker Application - AI Agent Instructions

## Project Overview
A dual-timesheet task tracking application built with React + TypeScript for managing work and personal tasks with time tracking, notifications, and Excel export capabilities.

## Architecture

### Core Stack
- **Frontend**: React 19 + TypeScript + Vite
- **UI Framework**: Material-UI (@mui/material) with Emotion styling
- **Database**: Dexie.js (IndexedDB wrapper) for local-first persistent storage
- **Routing**: React Router DOM v7
- **Forms**: React Hook Form for validation
- **Date Utils**: date-fns for date manipulation
- **Notifications**: React-Toastify + Browser Notification API
- **Export**: xlsx (SheetJS) for Excel export
- **Charts**: Recharts for data visualization

### Project Structure
```
src/
├── components/     # Reusable UI components (TaskForm, TaskList, TimesheetView, etc.)
├── pages/          # Route-level pages (Dashboard, WorkTimesheet, PersonalTimesheet, AllTasks, Settings)
├── services/       # Business logic (database.ts, notifications.ts, excelExport.ts)
├── types/          # TypeScript interfaces (Task, Project, NotificationSettings, etc.)
├── utils/          # Helper functions (dateHelpers.ts)
└── contexts/       # React Context for global state
```

## Key Domain Concepts

### Dual Timesheet System
- **Work Timesheet**: Friday, Saturday, Sunday are OFF days (not editable/tracked)
- **Personal Timesheet**: Active all 7 days of the week
- Tasks are categorized by `type: 'work' | 'personal'`

### Data Model (src/types/index.ts)
- **Task**: Core entity with optional start/end times, project association, duration calculation
- **Project**: Grouping mechanism with type and color coding
- **NotificationSettings**: Daily reminder configuration
- **ExportConfig**: Date range and filter settings for Excel export

### Database Service (Dexie.js)
- Local-first architecture using IndexedDB via Dexie.js
- All CRUD operations go through `src/services/database.ts`
- Use `dexie-react-hooks` for reactive queries in components
- Schema includes: tasks, projects, notificationSettings tables

## Development Workflows

### Running the Application
```bash
npm run dev          # Start dev server (typically http://localhost:5173)
npm run build        # TypeScript compile + production build
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

### Date Handling Conventions
- Use `date-fns` for all date operations (format, parse, add, subtract)
- Store dates as JavaScript Date objects in IndexedDB
- Weekend detection for work timesheet: Friday (5), Saturday (6), Sunday (0)
- Duration stored in minutes as integer

### Notification System
- Request browser notification permission on first load
- Use `src/services/notifications.ts` for scheduling end-of-day reminders
- Check user's NotificationSettings from database before triggering
- Default time: 8:00 PM daily

### Excel Export
- Use `src/services/excelExport.ts` with xlsx library
- Support date range filtering via ExportConfig
- Include task details, project names, duration calculations
- Optional statistics sheet with summary data

## Component Patterns

### Form Handling
- Use React Hook Form with TypeScript for all forms
- Material-UI controlled components with `Controller`
- Validation rules defined inline or in utility functions

### State Management
- Dexie React Hooks for database-driven state (`useLiveQuery`)
- React Context for global app state (theme, user preferences)
- Local component state for UI-only concerns

### Material-UI Theming
- Centralized theme configuration in App.tsx or theme.ts
- Use MUI's `ThemeProvider` for consistent styling
- Icons from `@mui/icons-material`

## Critical Patterns

### Task Duration Calculation
- If both startTime and endTime exist: `duration = (endTime - startTime) in minutes`
- Manual duration entry allowed if times not provided
- Display in HH:MM format in UI

### Work Day Filtering
```typescript
const isWorkDay = (date: Date) => {
  const day = date.getDay();
  return day !== 0 && day !== 5 && day !== 6; // Not Sun, Fri, Sat
};
```

### TypeScript Strict Mode
- Project uses strict TypeScript (`tsconfig.json`)
- All types defined in `src/types/index.ts`
- Avoid `any`, prefer explicit typing

## Testing & Debugging
- Browser DevTools for IndexedDB inspection (Application tab)
- React DevTools for component hierarchy
- Console logs for Dexie queries during development

## Important Notes
- **No backend server**: All data stored locally in browser IndexedDB
- **Data persistence**: IndexedDB survives browser refreshes, not incognito mode
- **Export feature**: Generate `.xlsx` files client-side, auto-download
- **Responsive design**: Mobile-first approach with MUI breakpoints
