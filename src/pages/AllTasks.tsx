import { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Stack,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Box,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputAdornment,
  Chip,
} from '@mui/material';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import {
  getAllTasks,
  getAllProjects,
  updateTask,
  deleteTask,
  addTask,
  addProject,
} from '../services/database';
import {
  exportTasksToExcel,
  exportWeeklySummary,
  exportProjectTasksToExcel,
} from '../services/excelExport';
import { importTasksFromExcel } from '../services/excelImport';
import { showToast, notifyTaskCreation, notifyTaskDeletion, notifyTaskUpdate, notifyExport } from '../services/notifications';
import type { Task, Project } from '../types';
import { getEndOfWeek, getToday } from '../utils/dateHelpers';
import { TaskForm, TaskList } from '../components';

export const AllTasks = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedType, setSelectedType] = useState<'all' | 'work' | 'personal'>('all');
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [exportStartDate, setExportStartDate] = useState<string>(
    getToday().toISOString().split('T')[0]
  );
  const [exportEndDate, setExportEndDate] = useState<string>(
    getEndOfWeek(getToday()).toISOString().split('T')[0]
  );

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [tasks, selectedType, selectedProject, searchQuery]);

  const loadData = async () => {
    try {
      const allTasks = await getAllTasks();
      const allProjects = await getAllProjects();
      setTasks(allTasks.sort((a, b) => b.date.getTime() - a.date.getTime()));
      setProjects(allProjects);
    } catch (error) {
      console.error('Failed to load tasks:', error);
      showToast('Failed to load tasks', 'error');
    }
  };

  const applyFilters = () => {
    let filtered = tasks;

    if (selectedType !== 'all') {
      filtered = filtered.filter(t => t.type === selectedType);
    }

    if (selectedProject !== 'all') {
      filtered = filtered.filter(t => t.projectId === selectedProject);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        t =>
          t.title.toLowerCase().includes(query) ||
          t.description.toLowerCase().includes(query)
      );
    }

    setFilteredTasks(filtered);
  };

  const handleAddTask = async (data: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      await addTask({
        ...data,
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
      await updateTask(editingTask.id, data);
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

  const handleCreateProject = async (projectData: Omit<Project, 'id' | 'createdAt'>) => {
    try {
      const newProject = await addProject({
        ...projectData,
        createdAt: new Date(),
      });
      showToast(`Project "${projectData.name}" created successfully`, 'success');
      await loadData(); // Reload to get new project
      return newProject;
    } catch (error) {
      console.error('Failed to create project:', error);
      showToast('Failed to create project', 'error');
      throw error;
    }
  };

  const handleImportFile = async () => {
    if (!selectedFile) {
      showToast('Please select a file to import', 'warning');
      return;
    }

    setImporting(true);
    try {
      const result = await importTasksFromExcel(selectedFile);
      
      if (result.success) {
        let message = `Successfully imported ${result.importedCount} tasks`;
        if (result.createdProjects.length > 0) {
          message += ` and created ${result.createdProjects.length} new project(s): ${result.createdProjects.join(', ')}`;
        }
        if (result.failedCount > 0) {
          message += `. ${result.failedCount} task(s) failed to import.`;
          showToast(message, 'warning');
        } else {
          showToast(message, 'success');
        }
        
        if (result.errors.length > 0) {
          console.error('Import errors:', result.errors);
        }
        
        // Reload tasks and projects
        await loadData();
        
        // Close dialog and reset
        setShowImportDialog(false);
        setSelectedFile(null);
      } else {
        showToast('Import failed. Please check the file format.', 'error');
        console.error('Import errors:', result.errors);
      }
    } catch (error) {
      console.error('Failed to import tasks:', error);
      showToast('Failed to import tasks', 'error');
    } finally {
      setImporting(false);
    }
  };

  const handleExport = async (format: 'all' | 'week' | 'project') => {
    try {
      const startDate = new Date(exportStartDate);
      const endDate = new Date(exportEndDate);

      switch (format) {
        case 'all':
          await exportTasksToExcel({
            startDate,
            endDate,
            type: selectedType === 'all' ? undefined : selectedType,
            includeProjects: true,
            includeStatistics: true,
          });
          break;
        case 'week':
          await exportWeeklySummary(startDate, endDate);
          break;
        case 'project':
          if (selectedProject !== 'all') {
            const project = projects.find(p => p.id === selectedProject);
            if (project) {
              await exportProjectTasksToExcel(selectedProject, project.name, startDate, endDate);
            }
          }
          break;
      }
      notifyExport('Tasks exported successfully');
      setShowExportDialog(false);
    } catch (error) {
      console.error('Failed to export tasks:', error);
      showToast('Failed to export tasks', 'error');
    }
  };

  const projectMap = new Map(projects.map(p => [p.id, p]));

  return (
    <Container maxWidth={false} sx={{ py: 4, px: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Stack 
          direction={{ xs: 'column', sm: 'row' }}
          justifyContent="space-between" 
          alignItems={{ xs: 'flex-start', sm: 'center' }}
          spacing={2}
        >
          <Box>
            <Typography 
              variant="h4" 
              sx={{ 
                fontWeight: 700,
                mb: 0.5,
                background: 'linear-gradient(135deg, #6366f1 0%, #ec4899 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              All Tasks
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Manage and track all your tasks in one place
            </Typography>
          </Box>
          <Stack direction="row" spacing={2}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => {
                setEditingTask(null);
                setShowTaskForm(true);
              }}
              sx={{
                background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                borderRadius: 2,
                px: 3,
              }}
            >
              New Task
            </Button>
            <Button
              variant="outlined"
              startIcon={<FileUploadIcon />}
              onClick={() => setShowImportDialog(true)}
              sx={{ 
                borderRadius: 2,
                borderWidth: 2,
                '&:hover': { borderWidth: 2 },
              }}
            >
              Import
            </Button>
            <Button
              variant="outlined"
              startIcon={<FileDownloadIcon />}
              onClick={() => setShowExportDialog(true)}
              sx={{ 
                borderRadius: 2,
                borderWidth: 2,
                '&:hover': { borderWidth: 2 },
              }}
            >
              Export
            </Button>
          </Stack>
        </Stack>
      </Box>

      {/* Filters */}
      <Paper 
        sx={{ 
          p: 3, 
          mb: 3,
          border: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Stack spacing={3}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FilterListIcon color="primary" />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Filters
            </Typography>
          </Box>
          
          <TextField
            fullWidth
            placeholder="Search tasks by title or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                bgcolor: 'background.default',
              },
            }}
          />
          
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <FormControl sx={{ flex: 1 }}>
              <InputLabel>Type</InputLabel>
              <Select
                value={selectedType}
                label="Type"
                onChange={(e) => setSelectedType(e.target.value as any)}
              >
                <MenuItem value="all">All Types</MenuItem>
                <MenuItem value="work">Work</MenuItem>
                <MenuItem value="personal">Personal</MenuItem>
              </Select>
            </FormControl>
            <FormControl sx={{ flex: 1 }}>
              <InputLabel>Project</InputLabel>
              <Select
                value={selectedProject}
                label="Project"
                onChange={(e) => setSelectedProject(e.target.value)}
              >
                <MenuItem value="all">All Projects</MenuItem>
                {projects.map(p => (
                  <MenuItem key={p.id} value={p.id}>
                    {p.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
          
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Chip 
              label={`${filteredTasks.length} task${filteredTasks.length !== 1 ? 's' : ''} found`}
              color="primary"
              variant="outlined"
              sx={{ fontWeight: 600 }}
            />
            {(searchQuery || selectedType !== 'all' || selectedProject !== 'all') && (
              <Button
                size="small"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedType('all');
                  setSelectedProject('all');
                }}
              >
                Clear Filters
              </Button>
            )}
          </Box>
        </Stack>
      </Paper>

      {/* Tasks List */}
      <Paper sx={{ p: 3 }}>
        <TaskList
          tasks={filteredTasks}
          projects={projectMap}
          onEdit={(task) => {
            setEditingTask(task);
            setShowTaskForm(true);
          }}
          onDelete={handleDeleteTask}
          onToggleComplete={handleToggleComplete}
          emptyMessage="No tasks match your filters"
        />
      </Paper>

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
            onSubmit={editingTask ? handleUpdateTask : handleAddTask}
            onProjectCreate={handleCreateProject}
            onCancel={() => {
              setShowTaskForm(false);
              setEditingTask(null);
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Import Dialog */}
      <Dialog
        open={showImportDialog}
        onClose={() => {
          setShowImportDialog(false);
          setSelectedFile(null);
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Import Tasks from Excel</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Stack spacing={3}>
            <Box
              sx={{
                border: '2px dashed',
                borderColor: selectedFile ? 'success.main' : 'divider',
                borderRadius: 2,
                p: 4,
                textAlign: 'center',
                bgcolor: selectedFile ? 'success.50' : 'background.default',
                transition: 'all 0.2s',
              }}
            >
              <CloudUploadIcon
                sx={{
                  fontSize: 48,
                  color: selectedFile ? 'success.main' : 'text.secondary',
                  mb: 2,
                }}
              />
              <Typography variant="h6" gutterBottom>
                {selectedFile ? selectedFile.name : 'Choose Excel File'}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {selectedFile
                  ? 'File selected. Click Import to continue.'
                  : 'Select an .xlsx or .xls file to import tasks'}
              </Typography>
              <Button
                variant="contained"
                component="label"
                sx={{ mt: 1 }}
              >
                {selectedFile ? 'Change File' : 'Select File'}
                <input
                  type="file"
                  hidden
                  accept=".xlsx,.xls"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setSelectedFile(file);
                    }
                  }}
                />
              </Button>
            </Box>

            <Paper sx={{ p: 2, bgcolor: 'info.50', border: '1px solid', borderColor: 'info.main' }}>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                📋 Required Excel Format:
              </Typography>
              <Typography variant="body2" component="div">
                <ul style={{ margin: 0, paddingLeft: 20 }}>
                  <li>Task Title (required)</li>
                  <li>Description</li>
                  <li>Type: "Work" or "Personal" (required)</li>
                  <li>Project (required - will be created if doesn't exist)</li>
                  <li>Date (required, format: MM/DD/YYYY)</li>
                  <li>Start Time (optional, format: HH:MM)</li>
                  <li>End Time (optional, format: HH:MM)</li>
                  <li>Duration (optional, format: HH:MM)</li>
                  <li>Status: "Completed" or "Pending"</li>
                </ul>
              </Typography>
            </Paper>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => {
              setShowImportDialog(false);
              setSelectedFile(null);
            }}
            disabled={importing}
          >
            Cancel
          </Button>
          <Button
            onClick={handleImportFile}
            variant="contained"
            disabled={!selectedFile || importing}
            startIcon={importing ? null : <FileUploadIcon />}
          >
            {importing ? 'Importing...' : 'Import Tasks'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Export Dialog */}
      <Dialog
        open={showExportDialog}
        onClose={() => setShowExportDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Export Tasks</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Stack spacing={2}>
            <TextField
              type="date"
              label="Start Date"
              value={exportStartDate}
              onChange={(e) => setExportStartDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
            <TextField
              type="date"
              label="End Date"
              value={exportEndDate}
              onChange={(e) => setExportEndDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
            <Typography variant="body2" color="textSecondary">
              Export format: Excel (xlsx)
            </Typography>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowExportDialog(false)} variant="outlined">
            Cancel
          </Button>
          <Button onClick={() => handleExport('all')} variant="contained">
            Export All
          </Button>
          <Button onClick={() => handleExport('week')} variant="contained">
            Export Weekly
          </Button>
          {selectedProject !== 'all' && (
            <Button onClick={() => handleExport('project')} variant="contained">
              Export Project
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Container>
  );
};
