import { useState, useEffect } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  Navigate,
  useLocation,
} from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Box,
  Typography,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Divider,
  ThemeProvider,
  CssBaseline,
  Button,
  Stack,
  IconButton,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import HomeIcon from '@mui/icons-material/Home';
import WorkIcon from '@mui/icons-material/Work';
import PersonIcon from '@mui/icons-material/Person';
import ListAltIcon from '@mui/icons-material/ListAlt';
import SettingsIcon from '@mui/icons-material/Settings';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import LogoutIcon from '@mui/icons-material/Logout';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { theme } from './theme';
import {
  Dashboard,
  WorkTimesheet,
  PersonalTimesheet,
  AllTasks,
  Settings,
  Login,
  Register,
  AdminDashboard,
} from './pages';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import {
  requestNotificationPermission,
  initializeEndOfDayReminder,
} from './services/notifications';
import './App.css';

const menuItems = [
  { label: 'Dashboard', path: '/', icon: <HomeIcon /> },
  { label: 'Work Timesheet', path: '/work-timesheet', icon: <WorkIcon /> },
  { label: 'Personal Timesheet', path: '/personal-timesheet', icon: <PersonIcon /> },
  { label: 'All Tasks', path: '/all-tasks', icon: <ListAltIcon /> },
  { label: 'Settings', path: '/settings', icon: <SettingsIcon /> },
];

// Protected Route Component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>Loading...</Box>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

// Admin Route Component
const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>Loading...</Box>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

function AppContent() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { isAuthenticated, isAdmin, logout } = useAuth();
  const location = useLocation();

  useEffect(() => {
    if (isAuthenticated) {
      // Request notification permission on app load
      requestNotificationPermission().then(() => {
        // Initialize end-of-day reminders if permission granted
        initializeEndOfDayReminder();
      });
    }
  }, [isAuthenticated]);

  // Don't show navigation on login/register pages
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';

  if (isAuthPage) {
    return (
      <>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Routes>
        <ToastContainer position="top-right" autoClose={3000} />
      </>
    );
  }

  return (
    <>
      <AppBar 
        position="sticky" 
        elevation={0}
        sx={{ 
          bgcolor: 'background.paper',
          color: 'text.primary',
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Toolbar sx={{ py: 1 }}>
            <IconButton
              onClick={() => setDrawerOpen(true)}
              sx={{ 
                mr: 2, 
                display: { sm: 'none' },
                color: 'primary.main',
              }}
            >
              <MenuIcon />
            </IconButton>
            <Typography 
              variant="h5" 
              sx={{ 
                flexGrow: 1, 
                fontWeight: 700,
                background: 'linear-gradient(135deg, #6366f1 0%, #ec4899 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Task Tracker
            </Typography>
            <Stack 
              direction="row" 
              spacing={0.5} 
              sx={{ display: { xs: 'none', sm: 'flex' } }}
            >
              {menuItems.map(item => (
                <Button
                  key={item.path}
                  component={Link}
                  to={item.path}
                  startIcon={item.icon}
                  sx={{
                    textTransform: 'none',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    color: 'text.primary',
                    px: 2,
                    py: 1,
                    borderRadius: 2,
                    '&:hover': {
                      bgcolor: 'primary.50',
                      color: 'primary.main',
                    },
                  }}
                >
                  {item.label}
                </Button>
              ))}
              {isAdmin && (
                <Button
                  component={Link}
                  to="/admin"
                  startIcon={<AdminPanelSettingsIcon />}
                  sx={{
                    textTransform: 'none',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    color: 'text.primary',
                    px: 2,
                    py: 1,
                    borderRadius: 2,
                    '&:hover': {
                      bgcolor: 'primary.50',
                      color: 'primary.main',
                    },
                  }}
                >
                  Admin
                </Button>
              )}
              <Button
                startIcon={<LogoutIcon />}
                onClick={logout}
                sx={{
                  textTransform: 'none',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  color: 'text.primary',
                  px: 2,
                  py: 1,
                  borderRadius: 2,
                  '&:hover': {
                    bgcolor: 'error.50',
                    color: 'error.main',
                  },
                }}
              >
                Logout
              </Button>
            </Stack>

          </Toolbar>
        </AppBar>

        {/* Mobile Sidebar */}
        <Drawer anchor="left" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
          <Box sx={{ width: 280, pt: 2 }}>
            <Typography variant="h6" sx={{ px: 2, mb: 2, fontWeight: 'bold' }}>
              Task Tracker
            </Typography>
            <Divider />
            <List>
              {menuItems.map(item => (
                <ListItem key={item.path} disablePadding>
                  <ListItemButton
                    component={Link}
                    to={item.path}
                    onClick={() => setDrawerOpen(false)}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      {item.icon}
                      <ListItemText primary={item.label} />
                    </Box>
                  </ListItemButton>
                </ListItem>
              ))}
              {isAdmin && (
                <ListItem disablePadding>
                  <ListItemButton
                    component={Link}
                    to="/admin"
                    onClick={() => setDrawerOpen(false)}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <AdminPanelSettingsIcon />
                      <ListItemText primary="Admin" />
                    </Box>
                  </ListItemButton>
                </ListItem>
              )}
              <Divider sx={{ my: 1 }} />
              <ListItem disablePadding>
                <ListItemButton
                  onClick={() => {
                    logout();
                    setDrawerOpen(false);
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, color: 'error.main' }}>
                    <LogoutIcon />
                    <ListItemText primary="Logout" />
                  </Box>
                </ListItemButton>
              </ListItem>
            </List>
          </Box>
        </Drawer>

        {/* Routes */}
        <Routes>
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/work-timesheet" element={<ProtectedRoute><WorkTimesheet /></ProtectedRoute>} />
          <Route path="/personal-timesheet" element={<ProtectedRoute><PersonalTimesheet /></ProtectedRoute>} />
          <Route path="/all-tasks" element={<ProtectedRoute><AllTasks /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
        </Routes>

        {/* Toast Notifications */}
        <ToastContainer
          position="bottom-right"
          autoClose={4000}
          hideProgressBar={false}
          newestOnTop={true}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
        />
      </>
    );
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
}

export default App;
