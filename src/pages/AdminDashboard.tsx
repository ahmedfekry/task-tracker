import { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Stack,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
} from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import AssignmentIcon from '@mui/icons-material/Assignment';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { apiService } from '../services/api';
import { showToast } from '../services/notifications';
import { format } from 'date-fns';

interface UserData {
  id: number;
  email: string;
  name: string;
  role: string;
  createdAt: string;
  stats?: {
    totalTasks: number;
    completedTasks: number;
    totalProjects: number;
  };
}

export const AdminDashboard = () => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<number | null>(null);
  const [userTasks, setUserTasks] = useState<any[]>([]);
  const [showTasksDialog, setShowTasksDialog] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const usersData = await apiService.getAllUsers();
      
      // Load stats for each user
      const usersWithStats = await Promise.all(
        usersData.map(async (user) => {
          try {
            const stats = await apiService.getUserStats(user.id);
            return { ...user, stats };
          } catch (error) {
            return user;
          }
        })
      );

      setUsers(usersWithStats);
    } catch (error: any) {
      showToast(error.message || 'Failed to load users', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleViewTasks = async (userId: number) => {
    try {
      const tasks = await apiService.getUserTasks(userId);
      setUserTasks(tasks);
      setSelectedUser(userId);
      setShowTasksDialog(true);
    } catch (error: any) {
      showToast(error.message || 'Failed to load user tasks', 'error');
    }
  };

  const totalTasks = users.reduce((sum, user) => sum + (user.stats?.totalTasks || 0), 0);
  const totalProjects = users.reduce((sum, user) => sum + (user.stats?.totalProjects || 0), 0);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth={false} sx={{ py: 4, px: 4 }}>
      <Typography
        variant="h4"
        sx={{
          mb: 4,
          fontWeight: 700,
          background: 'linear-gradient(135deg, #6366f1 0%, #ec4899 100%)',
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}
      >
        Admin Dashboard
      </Typography>

      {/* Statistics Cards */}
      <Stack direction="row" spacing={3} sx={{ mb: 4, flexWrap: 'wrap' }}>
        <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
          <Card
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
            }}
          >
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Box
                  sx={{
                    bgcolor: 'rgba(255, 255, 255, 0.2)',
                    p: 1.5,
                    borderRadius: 2,
                  }}
                >
                  <PeopleIcon sx={{ fontSize: 32 }} />
                </Box>
                <Box>
                  <Typography variant="h3" sx={{ fontWeight: 700 }}>
                    {users.length}
                  </Typography>
                  <Typography variant="body2">Total Users</Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Box>

        <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
          <Card
            sx={{
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              color: 'white',
            }}
          >
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Box
                  sx={{
                    bgcolor: 'rgba(255, 255, 255, 0.2)',
                    p: 1.5,
                    borderRadius: 2,
                  }}
                >
                  <AssignmentIcon sx={{ fontSize: 32 }} />
                </Box>
                <Box>
                  <Typography variant="h3" sx={{ fontWeight: 700 }}>
                    {totalTasks}
                  </Typography>
                  <Typography variant="body2">Total Tasks</Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Box>

        <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
          <Card
            sx={{
              background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
              color: 'white',
            }}
          >
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Box
                  sx={{
                    bgcolor: 'rgba(255, 255, 255, 0.2)',
                    p: 1.5,
                    borderRadius: 2,
                  }}
                >
                  <AssignmentIcon sx={{ fontSize: 32 }} />
                </Box>
                <Box>
                  <Typography variant="h3" sx={{ fontWeight: 700 }}>
                    {totalProjects}
                  </Typography>
                  <Typography variant="body2">Total Projects</Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Box>
      </Stack>

      {/* Users Table */}
      <Paper sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.50' }}>
                <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Email</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Role</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Tasks</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Completed</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Projects</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Joined</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id} hover>
                  <TableCell>{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Chip
                      label={user.role}
                      size="small"
                      color={user.role === 'admin' ? 'primary' : 'default'}
                    />
                  </TableCell>
                  <TableCell>{user.stats?.totalTasks || 0}</TableCell>
                  <TableCell>{user.stats?.completedTasks || 0}</TableCell>
                  <TableCell>{user.stats?.totalProjects || 0}</TableCell>
                  <TableCell>
                    {format(new Date(user.createdAt), 'MMM dd, yyyy')}
                  </TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      onClick={() => handleViewTasks(user.id)}
                      color="primary"
                    >
                      <VisibilityIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* User Tasks Dialog */}
      <Dialog
        open={showTasksDialog}
        onClose={() => setShowTasksDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          User Tasks
          {selectedUser && (
            <Typography variant="body2" color="text.secondary">
              {users.find((u) => u.id === selectedUser)?.name}
            </Typography>
          )}
        </DialogTitle>
        <DialogContent>
          {userTasks.length === 0 ? (
            <Typography color="text.secondary" align="center" sx={{ py: 4 }}>
              No tasks found
            </Typography>
          ) : (
            <List>
              {userTasks.map((task) => (
                <ListItem key={task.id} divider>
                  <ListItemText
                    primary={task.title}
                    secondary={
                      <Stack spacing={0.5}>
                        <Typography variant="body2" color="text.secondary">
                          {task.description}
                        </Typography>
                        <Stack direction="row" spacing={1} flexWrap="wrap">
                          <Chip
                            label={task.type}
                            size="small"
                            color={task.type === 'work' ? 'primary' : 'secondary'}
                          />
                          <Chip
                            label={task.status}
                            size="small"
                            color={task.status === 'completed' ? 'success' : 'default'}
                          />
                          {task.projectName && (
                            <Chip
                              label={task.projectName}
                              size="small"
                              sx={{
                                bgcolor: task.projectColor,
                                color: 'white',
                              }}
                            />
                          )}
                          <Chip
                            label={format(new Date(task.date), 'MMM dd, yyyy')}
                            size="small"
                            variant="outlined"
                          />
                        </Stack>
                      </Stack>
                    }
                  />
                </ListItem>
              ))}
            </List>
          )}
        </DialogContent>
      </Dialog>
    </Container>
  );
};
