import { useEffect, useState } from 'react';
import {
  Box,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  IconButton,
  Tooltip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useForm, Controller } from 'react-hook-form';
import type { Task, Project } from '../types';
import { calculateDuration, formatTime } from '../utils/dateHelpers';
import { ProjectForm } from './ProjectForm';

interface TaskFormProps {
  onSubmit: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel?: () => void;
  initialData?: Task;
  projects: Project[];
  defaultType?: 'work' | 'personal';
  onProjectCreate?: (project: Omit<Project, 'id' | 'createdAt'>) => void;
}

export const TaskForm = ({
  onSubmit,
  onCancel,
  initialData,
  projects,
  defaultType = 'work',
  onProjectCreate,
}: TaskFormProps) => {
  const [showProjectForm, setShowProjectForm] = useState(false);
  const { control, handleSubmit, watch, setValue } = useForm({
    defaultValues: initialData || {
      title: '',
      description: '',
      type: defaultType,
      projectId: undefined,
      date: new Date(),
      startTime: undefined,
      endTime: undefined,
      duration: undefined,
      status: 'pending',
    },
  });

  const startTime = watch('startTime');
  const endTime = watch('endTime');

  useEffect(() => {
    if (startTime && endTime) {
      const duration = calculateDuration(startTime, endTime);
      setValue('duration', duration);
    }
  }, [startTime, endTime, setValue]);

  return (
    <Box
      component="form"
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      autoComplete="off"
      sx={{ p: 2 }}
    >
      <Stack spacing={2}>
        <Controller
          name="title"
          control={control}
          rules={{ required: 'Task title is required' }}
          render={({ field, fieldState: { error } }) => (
            <TextField
              {...field}
              label="Task Title"
              fullWidth
              error={!!error}
              helperText={error?.message}
            />
          )}
        />

        <Controller
          name="description"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              label="Description"
              fullWidth
              multiline
              rows={3}
              placeholder="Add task details..."
            />
          )}
        />

        <Controller
          name="type"
          control={control}
          render={({ field }) => (
            <FormControl fullWidth>
              <InputLabel>Task Type</InputLabel>
              <Select {...field} label="Task Type">
                <MenuItem value="work">Work</MenuItem>
                <MenuItem value="personal">Personal</MenuItem>
              </Select>
            </FormControl>
          )}
        />

        <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
          <Controller
            name="projectId"
            control={control}
            rules={{ required: 'Please select or create a project' }}
            render={({ field, fieldState: { error } }) => (
              <FormControl fullWidth error={!!error}>
                <InputLabel>Project *</InputLabel>
                <Select
                  {...field}
                  label="Project *"
                  value={field.value || ''}
                >
                  {projects.length === 0 && (
                    <MenuItem value="" disabled>
                      No projects - Create one first
                    </MenuItem>
                  )}
                  {projects.map(project => (
                    <MenuItem key={project.id} value={project.id}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box
                          sx={{
                            width: 12,
                            height: 12,
                            borderRadius: '50%',
                            bgcolor: project.color,
                          }}
                        />
                        {project.name}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
                {error && (
                  <Box sx={{ color: 'error.main', fontSize: '0.75rem', mt: 0.5, ml: 1.75 }}>
                    {error.message}
                  </Box>
                )}
              </FormControl>
            )}
          />
          {onProjectCreate && (
            <Tooltip title="Create new project">
              <IconButton
                onClick={() => setShowProjectForm(true)}
                color="primary"
                sx={{
                  mt: 1,
                  border: '2px dashed',
                  borderColor: 'primary.main',
                  borderRadius: 2,
                }}
              >
                <AddIcon />
              </IconButton>
            </Tooltip>
          )}
        </Box>

        <Controller
          name="date"
          control={control}
          rules={{ required: 'Date is required' }}
          render={({ field, fieldState: { error } }) => (
            <TextField
              type="date"
              label="Date"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={field.value instanceof Date ? field.value.toISOString().split('T')[0] : ''}
              onChange={(e) => field.onChange(new Date(e.target.value))}
              error={!!error}
              helperText={error?.message}
            />
          )}
        />

        <Stack direction="row" spacing={2}>
          <Controller
            name="startTime"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                type="time"
                label="Start Time (Optional)"
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={field.value ? formatTime(field.value, 'HH:mm') : ''}
                onChange={(e) => {
                  if (e.target.value) {
                    const [hours, minutes] = e.target.value.split(':');
                    const date = new Date();
                    date.setHours(parseInt(hours), parseInt(minutes), 0, 0);
                    field.onChange(date);
                  } else {
                    field.onChange(undefined);
                  }
                }}
              />
            )}
          />

          <Controller
            name="endTime"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                type="time"
                label="End Time (Optional)"
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={field.value ? formatTime(field.value, 'HH:mm') : ''}
                onChange={(e) => {
                  if (e.target.value) {
                    const [hours, minutes] = e.target.value.split(':');
                    const date = new Date();
                    date.setHours(parseInt(hours), parseInt(minutes), 0, 0);
                    field.onChange(date);
                  } else {
                    field.onChange(undefined);
                  }
                }}
              />
            )}
          />
        </Stack>

        <Controller
          name="duration"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              type="number"
              label="Duration (minutes) - Auto-calculated"
              fullWidth
              inputProps={{ readOnly: true }}
              helperText="Duration is automatically calculated from start and end times"
            />
          )}
        />

        <Controller
          name="status"
          control={control}
          render={({ field }) => (
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select {...field} label="Status">
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
              </Select>
            </FormControl>
          )}
        />

        <Stack direction="row" spacing={2} justifyContent="flex-end">
          <Button onClick={onCancel} variant="outlined">
            Cancel
          </Button>
          <Button type="submit" variant="contained">
            {initialData ? 'Update Task' : 'Create Task'}
          </Button>
        </Stack>
      </Stack>
      {onProjectCreate && (
        <ProjectForm
          open={showProjectForm}
          onClose={() => setShowProjectForm(false)}
          onSubmit={(project) => {
            onProjectCreate(project);
            setShowProjectForm(false);
          }}
        />
      )}    </Box>
  );
};
