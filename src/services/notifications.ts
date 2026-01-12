import { toast } from 'react-toastify';
import { getNotificationSettings } from './database';
import { parseTimeString } from '../utils/dateHelpers';

let notificationIntervalId: ReturnType<typeof setInterval> | null = null;

/**
 * Request browser notification permission
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    console.log('This browser does not support notifications');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    try {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }

  return false;
}

/**
 * Send browser notification
 */
export function sendBrowserNotification(
  title: string,
  options?: NotificationOptions
): void {
  if ('Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification(title, {
        icon: '/vite.svg',
        ...options,
      });
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  }
}

/**
 * Show toast notification
 */
export function showToast(
  message: string,
  type: 'success' | 'error' | 'info' | 'warning' = 'info'
): void {
  toast[type](message, {
    position: 'bottom-right',
    autoClose: 4000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
  });
}

/**
 * Initialize end-of-day reminder
 */
export async function initializeEndOfDayReminder(): Promise<void> {
  if (notificationIntervalId) {
    clearInterval(notificationIntervalId);
  }

  const settings = await getNotificationSettings();

  if (!settings.enabled) {
    return;
  }

  // Check every minute if it's time to send reminder
  notificationIntervalId = setInterval(async () => {
    const now = new Date();
    const dayOfWeek = now.getDay();

    // Check if notifications are enabled for this day
    if (!settings.daysEnabled[dayOfWeek]) {
      return;
    }

    // Parse the reminder time
    const reminderTime = parseTimeString(settings.time);

    // Check if current time matches reminder time (within 1 minute)
    if (
      now.getHours() === reminderTime.getHours() &&
      now.getMinutes() === reminderTime.getMinutes()
    ) {
      sendBrowserNotification('End of Day Reminder', {
        body: 'Time to review your daily tasks and track your time',
      });

      showToast('End of day reminder: Time to review your tasks!', 'info');
    }
  }, 60000); // Check every minute
}

/**
 * Stop end-of-day reminder
 */
export function stopEndOfDayReminder(): void {
  if (notificationIntervalId) {
    clearInterval(notificationIntervalId);
    notificationIntervalId = null;
  }
}

/**
 * Send task completion notification
 */
export function notifyTaskCompletion(taskTitle: string): void {
  sendBrowserNotification('Task Completed', {
    body: `"${taskTitle}" has been marked as completed`,
    tag: 'task-completion',
  });

  showToast(`Task "${taskTitle}" completed!`, 'success');
}

/**
 * Send task creation notification
 */
export function notifyTaskCreation(taskTitle: string): void {
  showToast(`Task "${taskTitle}" created successfully!`, 'success');
}

/**
 * Send task deletion notification
 */
export function notifyTaskDeletion(taskTitle: string): void {
  showToast(`Task "${taskTitle}" deleted!`, 'info');
}

/**
 * Send task update notification
 */
export function notifyTaskUpdate(taskTitle: string): void {
  showToast(`Task "${taskTitle}" updated!`, 'success');
}

/**
 * Send export notification
 */
export function notifyExport(fileName: string): void {
  showToast(`Export saved as ${fileName}`, 'success');
}

/**
 * Send error notification
 */
export function notifyError(message: string): void {
  showToast(message, 'error');
}

/**
 * Send warning notification
 */
export function notifyWarning(message: string): void {
  showToast(message, 'warning');
}
