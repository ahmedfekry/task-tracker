import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Button,
  Box,
  Chip,
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import type { Project } from '../types';

interface ProjectFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (project: Omit<Project, 'id' | 'createdAt'>) => void;
  initialData?: Project;
}

const PROJECT_COLORS = [
  '#FF6B6B', // Red
  '#4ECDC4', // Teal
  '#45B7D1', // Blue
  '#FFA07A', // Light Salmon
  '#98D8C8', // Mint
  '#F7DC6F', // Yellow
  '#BB8FCE', // Purple
  '#85C1E2', // Sky Blue
  '#F8B88B', // Orange
  '#52B788', // Green
];

export const ProjectForm = ({
  open,
  onClose,
  onSubmit,
  initialData,
}: ProjectFormProps) => {
  const { control, handleSubmit, reset } = useForm({
    defaultValues: initialData || {
      name: '',
      type: 'work' as const,
      color: PROJECT_COLORS[0],
    },
  });

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {initialData ? 'Edit Project' : 'Create New Project'}
      </DialogTitle>
      <DialogContent sx={{ pt: 2 }}>
        <Stack spacing={2}>
          <Controller
            name="name"
            control={control}
            rules={{ required: 'Project name is required' }}
            render={({ field, fieldState: { error } }) => (
              <TextField
                {...field}
                label="Project Name"
                fullWidth
                error={!!error}
                helperText={error?.message}
              />
            )}
          />

          <Controller
            name="type"
            control={control}
            render={({ field }) => (
              <FormControl fullWidth>
                <InputLabel>Type</InputLabel>
                <Select {...field} label="Type">
                  <MenuItem value="work">Work</MenuItem>
                  <MenuItem value="personal">Personal</MenuItem>
                </Select>
              </FormControl>
            )}
          />

          <Controller
            name="color"
            control={control}
            render={({ field }) => (
              <FormControl fullWidth>
                <InputLabel>Color</InputLabel>
                <Select {...field} label="Color">
                  {PROJECT_COLORS.map(color => (
                    <MenuItem key={color} value={color}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box
                          sx={{
                            width: 20,
                            height: 20,
                            bgcolor: color,
                            borderRadius: 1,
                          }}
                        />
                        {color}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} variant="outlined">
          Cancel
        </Button>
        <Button
          onClick={handleSubmit(data => {
            onSubmit(data);
            handleClose();
          })}
          variant="contained"
        >
          {initialData ? 'Update' : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

interface ProjectSelectorProps {
  projects: Project[];
  selectedProjectId?: string;
  onChange: (projectId: string | undefined) => void;
  onAdd?: () => void;
}

export const ProjectSelector = ({
  projects,
  selectedProjectId,
  onChange,
  onAdd,
}: ProjectSelectorProps) => {
  return (
    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
      {projects.map(project => (
        <Chip
          key={project.id}
          label={project.name}
          onClick={() => onChange(project.id)}
          onDelete={
            selectedProjectId === project.id
              ? () => onChange(undefined)
              : undefined
          }
          variant={selectedProjectId === project.id ? 'filled' : 'outlined'}
          sx={{
            bgcolor:
              selectedProjectId === project.id ? project.color : undefined,
            color: selectedProjectId === project.id ? '#fff' : undefined,
          }}
        />
      ))}
      {onAdd && (
        <Button size="small" variant="outlined" onClick={onAdd}>
          + Add Project
        </Button>
      )}
    </Box>
  );
};
