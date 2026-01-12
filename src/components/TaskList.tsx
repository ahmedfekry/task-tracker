import {
  IconButton,
  Box,
  Chip,
  Stack,
  Typography,
  Card,
  CardContent,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import type { Task, Project } from '../types';
import { formatDuration } from '../utils/dateHelpers';

interface TaskListProps {
  tasks: Task[];
  projects?: Map<string, Project>;
  onEdit?: (task: Task) => void;
  onDelete?: (taskId: string) => void;
  onToggleComplete?: (taskId: string, completed: boolean) => void;
  emptyMessage?: string;
}

const getProjectColor = (projectId?: string, projects?: Map<string, Project>) => {
  if (!projectId || !projects) return undefined;
  return projects.get(projectId)?.color;
};

export const TaskList = ({
  tasks,
  projects,
  onEdit,
  onDelete,
  onToggleComplete,
  emptyMessage = 'No tasks found',
}: TaskListProps) => {
  if (tasks.length === 0) {
    return (
      <Box 
        sx={{ 
          p: 6, 
          textAlign: 'center',
          bgcolor: 'background.paper',
          borderRadius: 2,
          border: '2px dashed',
          borderColor: 'divider',
        }}
      >
        <Typography color="textSecondary" variant="h6" fontWeight={500}>
          {emptyMessage}
        </Typography>
      </Box>
    );
  }

  return (
    <Stack spacing={2}>
      {tasks.map(task => (
        <Card
          key={task.id}
          sx={{
            position: 'relative',
            overflow: 'visible',
            transition: 'all 0.2s',
            opacity: task.status === 'completed' ? 0.7 : 1,
            border: '1px solid',
            borderColor: task.status === 'completed' ? 'success.light' : 'divider',
            '&:hover': {
              borderColor: task.status === 'completed' ? 'success.main' : 'primary.main',
              boxShadow: 4,
            },
          }}
        >
          <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
            <Stack direction="row" spacing={2} alignItems="flex-start">
              {onToggleComplete && (
                <IconButton
                  onClick={() => onToggleComplete(task.id, task.status !== 'completed')}
                  size="small"
                  sx={{ 
                    mt: -0.5,
                    color: task.status === 'completed' ? 'success.main' : 'text.secondary',
                  }}
                >
                  {task.status === 'completed' ? (
                    <CheckCircleIcon fontSize="medium" />
                  ) : (
                    <RadioButtonUncheckedIcon fontSize="medium" />
                  )}
                </IconButton>
              )}
              
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Stack direction="row" alignItems="center" spacing={1} mb={0.5}>
                  <Typography
                    variant="h6"
                    sx={{
                      textDecoration: task.status === 'completed' ? 'line-through' : 'none',
                      color: task.status === 'completed' ? 'text.secondary' : 'text.primary',
                      fontSize: '1.1rem',
                      fontWeight: 600,
                    }}
                  >
                    {task.title}
                  </Typography>
                </Stack>

                {task.description && (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      mb: 1.5,
                      textDecoration: task.status === 'completed' ? 'line-through' : 'none',
                    }}
                  >
                    {task.description}
                  </Typography>
                )}

                <Stack direction="row" spacing={1} flexWrap="wrap" alignItems="center">
                  <Chip
                    label={task.type === 'work' ? 'Work' : 'Personal'}
                    size="small"
                    color={task.type === 'work' ? 'primary' : 'secondary'}
                    sx={{ fontWeight: 600, fontSize: '0.75rem' }}
                  />
                  
                  {task.projectId && projects?.get(task.projectId) && (
                    <Chip
                      label={projects.get(task.projectId)?.name}
                      size="small"
                      sx={{
                        bgcolor: getProjectColor(task.projectId, projects) + '20',
                        color: getProjectColor(task.projectId, projects),
                        borderColor: getProjectColor(task.projectId, projects),
                        border: '1px solid',
                        fontWeight: 600,
                        fontSize: '0.75rem',
                      }}
                    />
                  )}

                  {task.duration && (
                    <Chip
                      icon={<AccessTimeIcon sx={{ fontSize: '0.9rem' }} />}
                      label={formatDuration(task.duration)}
                      size="small"
                      variant="outlined"
                      sx={{ fontWeight: 600, fontSize: '0.75rem' }}
                    />
                  )}
                </Stack>
              </Box>

              <Stack direction="row" spacing={0.5}>
                {onEdit && (
                  <IconButton
                    onClick={() => onEdit(task)}
                    size="small"
                    sx={{
                      color: 'primary.main',
                      '&:hover': {
                        bgcolor: 'primary.50',
                      },
                    }}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                )}
                {onDelete && (
                  <IconButton
                    onClick={() => onDelete(task.id)}
                    size="small"
                    sx={{
                      color: 'error.main',
                      '&:hover': {
                        bgcolor: 'error.50',
                      },
                    }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                )}
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      ))}
    </Stack>
  );
};
