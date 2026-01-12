import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Stack,
  Chip,
} from '@mui/material';
import type { Task, Project } from '../types';
import { formatDuration } from '../utils/dateHelpers';

interface TimesheetViewProps {
  tasks: Task[];
  projects?: Map<string, Project>;
  title?: string;
  showTotals?: boolean;
}

export const TimesheetView = ({
  tasks,
  projects,
  title,
  showTotals = true,
}: TimesheetViewProps) => {
  const totalDuration = tasks.reduce((sum, t) => sum + (t.duration || 0), 0);
  const completedTasks = tasks.filter(t => t.status === 'completed').length;

  if (tasks.length === 0) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="textSecondary">No tasks in this timesheet</Typography>
      </Paper>
    );
  }

  return (
    <Box>
      {title && <Typography variant="h6" sx={{ mb: 2 }}>{title}</Typography>}
      
      <TableContainer component={Paper}>
        <Table>
          <TableHead sx={{ bgcolor: 'primary.light' }}>
            <TableRow>
              <TableCell>Task</TableCell>
              <TableCell>Project</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Duration</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {tasks.map(task => (
              <TableRow key={task.id}>
                <TableCell>
                  <Stack>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                      {task.title}
                    </Typography>
                    {task.description && (
                      <Typography variant="caption" color="textSecondary">
                        {task.description}
                      </Typography>
                    )}
                  </Stack>
                </TableCell>
                <TableCell>
                  {task.projectId && projects?.has(task.projectId)
                    ? projects.get(task.projectId)?.name
                    : '-'}
                </TableCell>
                <TableCell>
                  <Chip
                    label={task.type === 'work' ? 'Work' : 'Personal'}
                    size="small"
                    color={task.type === 'work' ? 'primary' : 'secondary'}
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>
                  {task.duration ? formatDuration(task.duration) : '-'}
                </TableCell>
                <TableCell>
                  <Chip
                    label={task.status === 'completed' ? 'Completed' : 'Pending'}
                    size="small"
                    color={task.status === 'completed' ? 'success' : 'warning'}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {showTotals && (
        <Paper sx={{ p: 2, mt: 2, bgcolor: 'action.hover' }}>
          <Stack direction="row" spacing={4} sx={{ textAlign: 'center' }}>
            <Box>
              <Typography variant="body2" color="textSecondary">
                Total Tasks
              </Typography>
              <Typography variant="h6">{tasks.length}</Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="textSecondary">
                Completed
              </Typography>
              <Typography variant="h6">{completedTasks}</Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="textSecondary">
                Completion Rate
              </Typography>
              <Typography variant="h6">
                {tasks.length > 0
                  ? Math.round((completedTasks / tasks.length) * 100)
                  : 0}
                %
              </Typography>
            </Box>
            <Box>
              <Typography variant="body2" color="textSecondary">
                Total Duration
              </Typography>
              <Typography variant="h6">{formatDuration(totalDuration)}</Typography>
            </Box>
          </Stack>
        </Paper>
      )}
    </Box>
  );
};
