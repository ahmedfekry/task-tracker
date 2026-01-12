import { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Stack,
  Button,
  Box,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import {
  getAllTasks,
  getAllProjects,
  updateTask,
  deleteTask,
  addTask,
  addProject,
} from '../services/database';
import {
  showToast,
  notifyTaskCreation,
  notifyTaskDeletion,
  notifyTaskUpdate,
} from '../services/notifications';
import type { Task, Project } from '../types';
import {
  getStartOfWeek,
  getEndOfWeek,
  getDaysInWeek,
  isWorkDay,
  formatDate,
  getToday,
} from '../utils/dateHelpers';
import { TaskForm, TaskList, TimesheetView } from '../components';

interface TimesheetPageProps {
  type: 'work' | 'personal';
}

export const TimesheetPage = ({ type }: TimesheetPageProps) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedWeekStart, setSelectedWeekStart] = useState(getStartOfWeek(getToday()));
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  useEffect(() => {
    loadData();
  }, [selectedWeekStart]);

  const loadData = async () => {
    try {
      const allTasks = await getAllTasks();
      const allProjects = await getAllProjects();

      const weekEnd = getEndOfWeek(selectedWeekStart);
      const weekTasks = allTasks
        .filter(
          t =>
            t.type === type &&
            t.date >= selectedWeekStart &&
            t.date <= weekEnd
        )
        .sort((a, b) => b.date.getTime() - a.date.getTime());

      setTasks(weekTasks);
      setProjects(allProjects.filter(p => p.type === type));
    } catch (error) {
      console.error('Failed to load timesheet data:', error);
      showToast('Failed to load timesheet', 'error');
    }
  };

  const handleCreateProject = async (projectData: Omit<Project, 'id' | 'createdAt'>) => {
    try {
      const newProject = await addProject({
        ...projectData,
        createdAt: new Date(),
      });
      showToast(`Project "${projectData.name}" created successfully`, 'success');
      const allProjects = await getAllProjects();
      setProjects(allProjects.filter(p => p.type === type));
      return newProject;
    } catch (error) {
      console.error('Failed to create project:', error);
      showToast('Failed to create project', 'error');
      throw error;
    }
  };

  const handleAddTask = async (data: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      await addTask({
        ...data,
        type,
        createdAt: new Date(),
      });
      notifyTaskCreation(data.title);
      setShowTaskForm(false);
      loadData();
    } catch (error) {
      console.error('Failed to add task:', error);
      showToast('Failed to create task', 'error');
    }
  };

  const handleUpdateTask = async (data: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!editingTask) return;

    try {
      await updateTask(editingTask.id, {
        ...data,
        type,
      });
      notifyTaskUpdate(data.title);
      setEditingTask(null);
      setShowTaskForm(false);
      loadData();
    } catch (error) {
      console.error('Failed to update task:', error);
      showToast('Failed to update task', 'error');
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (window.confirm(`Delete task "${task?.title}"?`)) {
      try {
        await deleteTask(taskId);
        notifyTaskDeletion(task?.title || 'Task');
        loadData();
      } catch (error) {
        console.error('Failed to delete task:', error);
        showToast('Failed to delete task', 'error');
      }
    }
  };

  const handleToggleComplete = async (taskId: string, completed: boolean) => {
    try {
      await updateTask(taskId, { status: completed ? 'completed' : 'pending' });
      loadData();
    } catch (error) {
      console.error('Failed to update task:', error);
      showToast('Failed to update task', 'error');
    }
  };

  const handlePreviousWeek = () => {
    const newStart = new Date(selectedWeekStart);
    newStart.setDate(newStart.getDate() - 7);
    setSelectedWeekStart(newStart);
  };

  const handleNextWeek = () => {
    const newStart = new Date(selectedWeekStart);
    newStart.setDate(newStart.getDate() + 7);
    setSelectedWeekStart(newStart);
  };

  const weekEnd = getEndOfWeek(selectedWeekStart);
  const weekDays = getDaysInWeek(selectedWeekStart);
  const projectMap = new Map(projects.map(p => [p.id, p]));

  const title = type === 'work' ? 'Work Timesheet' : 'Personal Timesheet';

  // Group tasks by date
  const tasksByDate = new Map<string, Task[]>();
  tasks.forEach(task => {
    const dateKey = formatDate(task.date, 'yyyy-MM-dd');
    if (!tasksByDate.has(dateKey)) {
      tasksByDate.set(dateKey, []);
    }
    tasksByDate.get(dateKey)!.push(task);
  });

  return (
    <Container maxWidth={false} sx={{ py: 4, px: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          {title}
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            setEditingTask(null);
            setShowTaskForm(true);
          }}
        >
          New Task
        </Button>
      </Box>

      {/* Week Navigation */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
          <Button onClick={handlePreviousWeek} variant="outlined">
            Previous Week
          </Button>
          <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
            {formatDate(selectedWeekStart, 'MMM dd')} - {formatDate(weekEnd, 'MMM dd, yyyy')}
          </Typography>
          <Button onClick={handleNextWeek} variant="outlined">
            Next Week
          </Button>
        </Stack>
      </Paper>

      {/* Daily View */}
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={3}
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' },
          gap: 3,
        }}
      >
        {weekDays.map(day => {
          const isOff = type === 'work' && !isWorkDay(day);
          const dateKey = formatDate(day, 'yyyy-MM-dd');
          const dayTasks = tasksByDate.get(dateKey) || [];

          return (
            <Box key={dateKey}>
              <Paper
                sx={{
                  p: 2,
                  minHeight: '400px',
                  bgcolor: isOff ? 'action.hover' : 'background.paper',
                  border: '2px solid',
                  borderColor: isOff ? 'divider' : 'primary.main',
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 'bold',
                      opacity: isOff ? 0.5 : 1,
                    }}
                  >
                    {formatDate(day, 'EEEE, MMM dd')}
                  </Typography>
                  {isOff && <Typography variant="caption">OFF</Typography>}
                </Box>

                {isOff ? (
                  <Typography color="textSecondary" sx={{ textAlign: 'center', py: 10 }}>
                    Weekend - Not tracked
                  </Typography>
                ) : (
                  <>
                    {dayTasks.length > 0 ? (
                      <TaskList
                        tasks={dayTasks}
                        projects={projectMap}
                        onEdit={(task) => {
                          setEditingTask(task);
                          setShowTaskForm(true);
                        }}
                        onDelete={handleDeleteTask}
                        onToggleComplete={handleToggleComplete}
                      />
                    ) : (
                      <Typography color="textSecondary" sx={{ textAlign: 'center', py: 4 }}>
                        No tasks
                      </Typography>
                    )}
                  </>
                )}
              </Paper>
            </Box>
          );
        })}
      </Stack>

      {/* Summary */}
      {tasks.length > 0 && (
        <Box sx={{ mt: 3 }}>
          <TimesheetView
            tasks={tasks}
            projects={projectMap}
            title="Weekly Summary"
            showTotals={true}
          />
        </Box>
      )}

      {/* Task Form Dialog */}
      <Dialog
        open={showTaskForm}
        onClose={() => {
          setShowTaskForm(false);
          setEditingTask(null);
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editingTask ? 'Edit Task' : 'Create New Task'}
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <TaskForm
            initialData={editingTask || undefined}
            projects={projects}
            defaultType={type}
            onSubmit={editingTask ? handleUpdateTask : handleAddTask}
            onProjectCreate={handleCreateProject}
            onCancel={() => {
              setShowTaskForm(false);
              setEditingTask(null);
            }}
          />
        </DialogContent>
      </Dialog>
    </Container>
  );
};
