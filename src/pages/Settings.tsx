import { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Stack,
  Typography,
  TextField,
  FormControlLabel,
  Switch,
  Button,
  Box,
  Table,
  TableBody,
  TableCell,
  TableRow,
  Alert,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import { getNotificationSettings, updateNotificationSettings, clearAllData } from '../services/database';
import {
  initializeEndOfDayReminder,
  stopEndOfDayReminder,
  requestNotificationPermission,
  showToast,
} from '../services/notifications';
import type { NotificationSettings } from '../types';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const Settings = () => {
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(
    'default'
  );
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadSettings();
    checkNotificationPermission();
  }, []);

  const loadSettings = async () => {
    try {
      const notificationSettings = await getNotificationSettings();
      setSettings(notificationSettings);
    } catch (error) {
      console.error('Failed to load settings:', error);
      showToast('Failed to load settings', 'error');
    }
  };

  const checkNotificationPermission = () => {
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
  };

  const handleRequestNotificationPermission = async () => {
    try {
      const granted = await requestNotificationPermission();
      if (granted) {
        setNotificationPermission('granted');
        showToast('Notification permission granted', 'success');
      } else {
        showToast('Notification permission denied', 'warning');
      }
    } catch (error) {
      console.error('Error requesting permission:', error);
      showToast('Failed to request notification permission', 'error');
    }
  };

  const handleToggleNotifications = (enabled: boolean) => {
    if (settings) {
      setSettings({ ...settings, enabled });
    }
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (settings) {
      setSettings({ ...settings, time: e.target.value });
    }
  };

  const handleDayToggle = (dayIndex: number) => {
    if (settings) {
      const newDaysEnabled = [...settings.daysEnabled];
      newDaysEnabled[dayIndex] = !newDaysEnabled[dayIndex];
      setSettings({ ...settings, daysEnabled: newDaysEnabled });
    }
  };

  const handleSaveSettings = async () => {
    if (!settings) return;
    
    setIsSaving(true);
    try {
      await updateNotificationSettings(settings);
      
      // Restart reminder with new settings
      stopEndOfDayReminder();
      if (settings.enabled && notificationPermission === 'granted') {
        await initializeEndOfDayReminder();
      }
      
      showToast('Settings saved successfully', 'success');
    } catch (error) {
      console.error('Failed to save settings:', error);
      showToast('Failed to save settings', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClearAllData = async () => {
    if (window.confirm('Are you sure? This will delete all tasks and projects permanently.')) {
      try {
        await clearAllData();
        showToast('All data cleared successfully', 'success');
        // Optionally reload or reset state
        loadSettings();
      } catch (error) {
        console.error('Failed to clear data:', error);
        showToast('Failed to clear data', 'error');
      }
    }
  };

  if (!settings) {
    return (
      <Container maxWidth={false} sx={{ py: 4, px: 4, maxWidth: '1400px', mx: 'auto' }}>
        <Typography>Loading settings...</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth={false} sx={{ py: 4, px: 4, maxWidth: '1400px', mx: 'auto' }}>
      <Typography variant="h4" sx={{ mb: 4, fontWeight: 'bold' }}>
        Settings
      </Typography>

      {/* Notifications Section */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 3 }}>
          Notifications
        </Typography>

        {notificationPermission !== 'granted' && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            Browser notifications are not enabled. Click the button below to enable them.
          </Alert>
        )}

        <Stack spacing={3}>
          <Box>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.enabled}
                  onChange={(e) => handleToggleNotifications(e.target.checked)}
                />
              }
              label={
                <Box>
                  <Typography variant="body1">Enable End-of-Day Reminders</Typography>
                  <Typography variant="caption" color="textSecondary">
                    Get notified at your scheduled time to review tasks
                  </Typography>
                </Box>
              }
            />
          </Box>

          {settings.enabled && (
            <>
              <TextField
                type="time"
                label="Reminder Time"
                value={settings.time}
                onChange={handleTimeChange}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />

              <Box>
                <Typography variant="body2" sx={{ mb: 2, fontWeight: 'bold' }}>
                  Enable Reminders For:
                </Typography>
                <Table size="small">
                  <TableBody>
                    {DAYS.map((day, index) => (
                      <TableRow key={day}>
                        <TableCell>
                          <FormControlLabel
                            control={
                              <Switch
                                checked={settings.daysEnabled[index]}
                                onChange={() => handleDayToggle(index)}
                              />
                            }
                            label={day}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
            </>
          )}

          {notificationPermission !== 'granted' && (
            <Button
              variant="contained"
              fullWidth
              onClick={handleRequestNotificationPermission}
            >
              Enable Notifications
            </Button>
          )}

          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSaveSettings}
            disabled={isSaving}
            fullWidth
          >
            {isSaving ? 'Saving...' : 'Save Notification Settings'}
          </Button>
        </Stack>
      </Paper>

      {/* Danger Zone */}
      <Paper sx={{ p: 3, border: '1px solid', borderColor: 'error.main' }}>
        <Typography variant="h6" sx={{ mb: 3, color: 'error.main' }}>
          Danger Zone
        </Typography>

        <Alert severity="error" sx={{ mb: 3 }}>
          These actions are permanent and cannot be undone.
        </Alert>

        <Button
          variant="contained"
          color="error"
          startIcon={<DeleteSweepIcon />}
          onClick={handleClearAllData}
          fullWidth
        >
          Clear All Data
        </Button>
      </Paper>
    </Container>
  );
};
