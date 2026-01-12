import {
  format,
  parse,
  isWithinInterval,
  startOfDay,
  endOfDay,
  differenceInMinutes,
  addDays,
  startOfWeek,
  endOfWeek,
} from 'date-fns';

/**
 * Check if a date is a work day (all 7 days are now work days)
 * Work schedule: Monday-Sunday (all days)
 */
export function isWorkDay(_date: Date): boolean {
  return true; // All days are work days now
}

/**
 * Format date to readable string
 */
export function formatDate(date: Date, formatStr: string = 'MMM dd, yyyy'): string {
  return format(date, formatStr);
}

/**
 * Format time to HH:MM format
 */
export function formatTime(date: Date, formatStr: string = 'HH:mm'): string {
  return format(date, formatStr);
}

/**
 * Format duration in minutes to HH:MM string
 */
export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

/**
 * Parse time string (HH:MM) to Date object
 */
export function parseTimeString(timeStr: string): Date {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date;
}

/**
 * Calculate duration between two dates in minutes
 */
export function calculateDuration(startTime: Date, endTime: Date): number {
  return differenceInMinutes(endTime, startTime);
}

/**
 * Get start of day for a given date
 */
export function getStartOfDay(date: Date): Date {
  return startOfDay(date);
}

/**
 * Get end of day for a given date
 */
export function getEndOfDay(date: Date): Date {
  return endOfDay(date);
}

/**
 * Check if date is within a time interval
 */
export function isDateInRange(date: Date, startDate: Date, endDate: Date): boolean {
  return isWithinInterval(date, { start: startDate, end: endDate });
}

/**
 * Get start of week (Monday)
 */
export function getStartOfWeek(date: Date): Date {
  return startOfWeek(date, { weekStartsOn: 1 });
}

/**
 * Get end of week (Sunday)
 */
export function getEndOfWeek(date: Date): Date {
  return endOfWeek(date, { weekStartsOn: 1 });
}

/**
 * Get work days for a given week
 */
export function getWorkDaysInWeek(date: Date): Date[] {
  const start = getStartOfWeek(date);
  const workDays: Date[] = [];
  
  for (let i = 0; i < 7; i++) {
    const day = addDays(start, i);
    if (isWorkDay(day)) {
      workDays.push(day);
    }
  }
  
  return workDays;
}

/**
 * Get all days in a week
 */
export function getDaysInWeek(date: Date): Date[] {
  const start = getStartOfWeek(date);
  const days: Date[] = [];
  
  for (let i = 0; i < 7; i++) {
    days.push(addDays(start, i));
  }
  
  return days;
}

/**
 * Get day name from date
 */
export function getDayName(date: Date): string {
  return format(date, 'EEEE');
}

/**
 * Get short day name from date (Mon, Tue, etc.)
 */
export function getShortDayName(date: Date): string {
  return format(date, 'EEE');
}

/**
 * Get month name from date
 */
export function getMonthName(date: Date): string {
  return format(date, 'MMMM');
}

/**
 * Get week number from date
 */
export function getWeekNumber(date: Date): number {
  const week = Math.ceil(date.getDate() / 7);
  return week;
}

/**
 * Compare two dates (ignoring time)
 */
export function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

/**
 * Add days to a date
 */
export function addDay(date: Date, days: number): Date {
  return addDays(date, days);
}

/**
 * Get today's date at midnight
 */
export function getToday(): Date {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

/**
 * Parse date from string
 */
export function parseDate(dateStr: string, formatStr: string = 'yyyy-MM-dd'): Date {
  return parse(dateStr, formatStr, new Date());
}

/**
 * Get next work day
 */
export function getNextWorkDay(date: Date): Date {
  let nextDay = addDays(date, 1);
  while (!isWorkDay(nextDay)) {
    nextDay = addDays(nextDay, 1);
  }
  return nextDay;
}

/**
 * Get previous work day
 */
export function getPreviousWorkDay(date: Date): Date {
  let prevDay = addDays(date, -1);
  while (!isWorkDay(prevDay)) {
    prevDay = addDays(prevDay, -1);
  }
  return prevDay;
}
