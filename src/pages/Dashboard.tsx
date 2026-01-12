import { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Paper,
  Typography,
  Button,
  Stack,
  Card,
  CardContent,
  Divider,
  LinearProgress,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import AddIcon from '@mui/icons-material/Add';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import WorkIcon from '@mui/icons-material/Work';
import PersonIcon from '@mui/icons-material/Person';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import {
  getAllTasks,
  getAllProjects,
  getStatistics,
} from '../services/database';
import { getToday, getStartOfWeek, getEndOfWeek, formatDuration } from '../utils/dateHelpers';
import type { Task, Project } from '../types';
import { TaskList } from '../components';

export const Dashboard = () => {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [stats, setStats] = useState({
    totalTasks: 0,
    completedTasks: 0,
    totalDuration: 0,
    workDuration: 0,
    personalDuration: 0,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const allTasks = await getAllTasks();
      const allProjects = await getAllProjects();
      const today = getToday();
      const weekStart = getStartOfWeek(today);
      const weekEnd = getEndOfWeek(today);

      const todayTasks = allTasks.filter(t => {
        const taskDate = new Date(t.date);
        return taskDate.getTime() === today.getTime();
      });

      const weekStats = await getStatistics(weekStart, weekEnd);

      setTasks(todayTasks.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, 5));
      setProjects(allProjects);
      setStats(weekStats);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    }
  };

  const projectMap = new Map(projects.map(p => [p.id, p]));
  const completionRate = stats.totalTasks > 0
    ? Math.round((stats.completedTasks / stats.totalTasks) * 100)
    : 0;

  return (
    <Container maxWidth={false} sx={{ py: 4, px: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography 
          variant="h4" 
          sx={{ 
            mb: 1, 
            fontWeight: 700,
            background: 'linear-gradient(135deg, #6366f1 0%, #ec4899 100%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Welcome back! Here's your productivity overview.
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Stack 
        direction={{ xs: 'column', sm: 'row' }} 
        spacing={2} 
        sx={{ mb: 4 }}
      >
        <Box sx={{ flex: 1 }}>
          <Card 
            sx={{ 
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                <Box>
                  <Typography 
                    variant="body2" 
                    sx={{ mb: 1, opacity: 0.9, fontWeight: 600 }}
                  >
                    This Week
                  </Typography>
                  <Typography variant="h3" sx={{ mb: 0.5, fontWeight: 700 }}>
                    {stats.totalTasks}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Total Tasks
                  </Typography>
                </Box>
                <Box
                  sx={{
                    bgcolor: 'rgba(255, 255, 255, 0.2)',
                    borderRadius: 2,
                    p: 1,
                  }}
                >
                  <TrendingUpIcon sx={{ fontSize: 32 }} />
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Box>

        <Box sx={{ flex: 1 }}>
          <Card
            sx={{
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: 'white',
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                <Box>
                  <Typography 
                    variant="body2" 
                    sx={{ mb: 1, opacity: 0.9, fontWeight: 600 }}
                  >
                    Completed
                  </Typography>
                  <Typography variant="h3" sx={{ mb: 0.5, fontWeight: 700 }}>
                    {stats.completedTasks}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    {completionRate}% Complete
                  </Typography>
                </Box>
                <Box
                  sx={{
                    bgcolor: 'rgba(255, 255, 255, 0.2)',
                    borderRadius: 2,
                    p: 1,
                  }}
                >
                  <CheckCircleIcon sx={{ fontSize: 32 }} />
                </Box>
              </Stack>
              <LinearProgress
                variant="determinate"
                value={completionRate}
                sx={{
                  mt: 2,
                  height: 8,
                  borderRadius: 4,
                  bgcolor: 'rgba(255, 255, 255, 0.2)',
                  '& .MuiLinearProgress-bar': {
                    bgcolor: 'white',
                    borderRadius: 4,
                  },
                }}
              />
            </CardContent>
          </Card>
        </Box>

        <Box sx={{ flex: 1 }}>
          <Card
            sx={{
              background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
              color: 'white',
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                <Box>
                  <Typography 
                    variant="body2" 
                    sx={{ mb: 1, opacity: 0.9, fontWeight: 600 }}
                  >
                    Work Time
                  </Typography>
                  <Typography variant="h3" sx={{ mb: 0.5, fontWeight: 700 }}>
                    {formatDuration(stats.workDuration).split(':')[0]}h
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Hours Tracked
                  </Typography>
                </Box>
                <Box
                  sx={{
                    bgcolor: 'rgba(255, 255, 255, 0.2)',
                    borderRadius: 2,
                    p: 1,
                  }}
                >
                  <WorkIcon sx={{ fontSize: 32 }} />
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Box>

        <Box sx={{ flex: 1 }}>
          <Card
            sx={{
              background: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)',
              color: 'white',
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                <Box>
                  <Typography 
                    variant="body2" 
                    sx={{ mb: 1, opacity: 0.9, fontWeight: 600 }}
                  >
                    Personal
                  </Typography>
                  <Typography variant="h3" sx={{ mb: 0.5, fontWeight: 700 }}>
                    {formatDuration(stats.personalDuration).split(':')[0]}h
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Hours Tracked
                  </Typography>
                </Box>
                <Box
                  sx={{
                    bgcolor: 'rgba(255, 255, 255, 0.2)',
                    borderRadius: 2,
                    p: 1,
                  }}
                >
                  <PersonIcon sx={{ fontSize: 32 }} />
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Box>
      </Stack>

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
        {/* Today's Tasks */}
        <Box sx={{ flex: 1 }}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Stack 
              direction="row" 
              justifyContent="space-between" 
              alignItems="center" 
              sx={{ mb: 3 }}
            >
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                  Today's Tasks
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {tasks.length} task{tasks.length !== 1 ? 's' : ''} for today
                </Typography>
              </Box>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                size="small"
                onClick={() => navigate('/work-timesheet')}
                sx={{ borderRadius: 2 }}
              >
                Add Task
              </Button>
            </Stack>

            <Divider sx={{ my: 2 }} />

            {tasks.length > 0 ? (
              <TaskList tasks={tasks} projects={projectMap} />
            ) : (
              <Box
                sx={{
                  textAlign: 'center',
                  py: 8,
                  bgcolor: 'background.default',
                  borderRadius: 2,
                }}
              >
                <Typography color="text.secondary" variant="h6" sx={{ mb: 1 }}>
                  No tasks for today
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Create your first task to get started
                </Typography>
              </Box>
            )}
          </Paper>
        </Box>

        {/* Quick Links */}
        <Box sx={{ width: { xs: '100%', md: '320px' } }}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
              Quick Actions
            </Typography>
            <Stack spacing={2}>
              <Button
                fullWidth
                variant="contained"
                startIcon={<WorkIcon />}
                onClick={() => navigate('/work-timesheet')}
                sx={{
                  py: 1.5,
                  justifyContent: 'flex-start',
                  background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                }}
              >
                Work Timesheet
              </Button>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<PersonIcon />}
                onClick={() => navigate('/personal-timesheet')}
                sx={{
                  py: 1.5,
                  justifyContent: 'flex-start',
                  borderWidth: 2,
                  '&:hover': { borderWidth: 2 },
                }}
              >
                Personal Timesheet
              </Button>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<TrendingUpIcon />}
                onClick={() => navigate('/all-tasks')}
                sx={{
                  py: 1.5,
                  justifyContent: 'flex-start',
                  borderWidth: 2,
                  '&:hover': { borderWidth: 2 },
                }}
              >
                All Tasks
              </Button>
            </Stack>
          </Paper>
        </Box>
      </Stack>
    </Container>
  );
};
