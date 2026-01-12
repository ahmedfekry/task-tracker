import * as XLSX from 'xlsx';
import type { Task, ExportConfig } from '../types';
import { formatDate, formatTime, formatDuration } from '../utils/dateHelpers';
import { getTasksByDateRange, getStatistics, getAllProjects } from './database';

interface ExcelTask {
  'Task Title': string;
  'Description': string;
  'Type': string;
  'Project': string;
  'Date': string;
  'Start Time': string;
  'End Time': string;
  'Duration (HH:MM)': string;
  'Status': string;
}

interface ExcelStatistics {
  'Metric': string;
  'Value': string | number;
}

/**
 * Export tasks to Excel file
 */
export async function exportTasksToExcel(config: ExportConfig): Promise<void> {
  try {
    const tasks = await getTasksByDateRange(config.startDate, config.endDate);
    const projects = await getAllProjects();

    // Filter tasks by type if specified
    const filteredTasks =
      config.type && config.type !== 'all'
        ? tasks.filter(t => t.type === config.type)
        : tasks;

    const projectMap = new Map(projects.map(p => [p.id, p]));

    // Prepare Excel data
    const excelTasks: ExcelTask[] = filteredTasks.map(task => ({
      'Task Title': task.title,
      'Description': task.description,
      'Type': task.type === 'work' ? 'Work' : 'Personal',
      'Project': task.projectId ? projectMap.get(task.projectId)?.name || 'N/A' : 'No Project',
      'Date': formatDate(task.date),
      'Start Time': task.startTime ? formatTime(task.startTime) : '-',
      'End Time': task.endTime ? formatTime(task.endTime) : '-',
      'Duration (HH:MM)': task.duration ? formatDuration(task.duration) : '-',
      'Status': task.status || 'pending',
    }));

    // Create workbook
    const wb = XLSX.utils.book_new();

    // Add tasks sheet
    const tasksSheet = XLSX.utils.json_to_sheet(excelTasks);
    XLSX.utils.book_append_sheet(wb, tasksSheet, 'Tasks');

    // Add statistics sheet if requested
    if (config.includeStatistics) {
      const statistics = await getStatistics(config.startDate, config.endDate);
      const statsData: ExcelStatistics[] = [
        { 'Metric': 'Total Tasks', 'Value': statistics.totalTasks },
        { 'Metric': 'Completed Tasks', 'Value': statistics.completedTasks },
        { 'Metric': 'Completion Rate (%)', 'Value': statistics.totalTasks > 0 ? Math.round((statistics.completedTasks / statistics.totalTasks) * 100) : 0 },
        { 'Metric': 'Total Duration (HH:MM)', 'Value': formatDuration(statistics.totalDuration) },
        { 'Metric': 'Work Duration (HH:MM)', 'Value': formatDuration(statistics.workDuration) },
        { 'Metric': 'Personal Duration (HH:MM)', 'Value': formatDuration(statistics.personalDuration) },
      ];

      if (config.includeProjects && Object.keys(statistics.projectBreakdown).length > 0) {
        statsData.push({ 'Metric': '', 'Value': '' }); // Blank row
        statsData.push({ 'Metric': 'Project Breakdown', 'Value': '' });

        for (const [projectId, duration] of Object.entries(statistics.projectBreakdown)) {
          const project = projectMap.get(projectId);
          const projectName = project?.name || 'Unknown Project';
          statsData.push({
            'Metric': projectName,
            'Value': formatDuration(duration),
          });
        }
      }

      const statsSheet = XLSX.utils.json_to_sheet(statsData);
      XLSX.utils.book_append_sheet(wb, statsSheet, 'Statistics');
    }

    // Generate filename
    const dateRange = `${formatDate(config.startDate, 'yyyy-MM-dd')}_to_${formatDate(config.endDate, 'yyyy-MM-dd')}`;
    const typeStr = config.type === 'all' || !config.type ? 'All' : config.type === 'work' ? 'Work' : 'Personal';
    const fileName = `Tasks_${typeStr}_${dateRange}.xlsx`;

    // Save file
    XLSX.writeFile(wb, fileName);

    return;
  } catch (error) {
    console.error('Error exporting tasks to Excel:', error);
    throw new Error('Failed to export tasks to Excel');
  }
}

/**
 * Export filtered tasks by project
 */
export async function exportProjectTasksToExcel(
  projectId: string,
  projectName: string,
  startDate: Date,
  endDate: Date
): Promise<void> {
  const allTasks = await getTasksByDateRange(startDate, endDate);
  const projectTasks = allTasks.filter(t => t.projectId === projectId);

  const excelTasks: ExcelTask[] = projectTasks.map(task => ({
    'Task Title': task.title,
    'Description': task.description,
    'Type': task.type === 'work' ? 'Work' : 'Personal',
    'Project': projectName,
    'Date': formatDate(task.date),
    'Start Time': task.startTime ? formatTime(task.startTime) : '-',
    'End Time': task.endTime ? formatTime(task.endTime) : '-',
    'Duration (HH:MM)': task.duration ? formatDuration(task.duration) : '-',
    'Status': task.status || 'pending',
  }));

  const wb = XLSX.utils.book_new();
  const sheet = XLSX.utils.json_to_sheet(excelTasks);
  XLSX.utils.book_append_sheet(wb, sheet, projectName);

  const fileName = `${projectName}_Tasks_${formatDate(startDate, 'yyyy-MM-dd')}_to_${formatDate(endDate, 'yyyy-MM-dd')}.xlsx`;
  XLSX.writeFile(wb, fileName);
}

/**
 * Export weekly summary
 */
export async function exportWeeklySummary(startDate: Date, endDate: Date): Promise<void> {
  const tasks = await getTasksByDateRange(startDate, endDate);
  const projects = await getAllProjects();
  const projectMap = new Map(projects.map(p => [p.id, p]));

  // Group tasks by date
  const tasksByDate = new Map<string, Task[]>();
  tasks.forEach(task => {
    const dateKey = formatDate(task.date, 'yyyy-MM-dd');
    if (!tasksByDate.has(dateKey)) {
      tasksByDate.set(dateKey, []);
    }
    tasksByDate.get(dateKey)!.push(task);
  });

  // Create workbook
  const wb = XLSX.utils.book_new();

  // Daily summary data
  const dailySummary: Array<{ 'Date': string; 'Tasks': number; 'Completed': number; 'Duration': string; 'Work Time': string; 'Personal Time': string }> = [];

  Array.from(tasksByDate.entries())
    .sort()
    .forEach(([date, dateTasks]) => {
      const completed = dateTasks.filter(t => t.status === 'completed').length;
      const totalDuration = dateTasks.reduce((sum, t) => sum + (t.duration || 0), 0);
      const workDuration = dateTasks
        .filter(t => t.type === 'work')
        .reduce((sum, t) => sum + (t.duration || 0), 0);
      const personalDuration = dateTasks
        .filter(t => t.type === 'personal')
        .reduce((sum, t) => sum + (t.duration || 0), 0);

      dailySummary.push({
        'Date': date,
        'Tasks': dateTasks.length,
        'Completed': completed,
        'Duration': formatDuration(totalDuration),
        'Work Time': formatDuration(workDuration),
        'Personal Time': formatDuration(personalDuration),
      });
    });

  const dailySheet = XLSX.utils.json_to_sheet(dailySummary);
  XLSX.utils.book_append_sheet(wb, dailySheet, 'Daily Summary');

  // Add detailed tasks sheet
  const excelTasks: ExcelTask[] = tasks.map(task => ({
    'Task Title': task.title,
    'Description': task.description,
    'Type': task.type === 'work' ? 'Work' : 'Personal',
    'Project': task.projectId ? projectMap.get(task.projectId)?.name || 'N/A' : 'No Project',
    'Date': formatDate(task.date),
    'Start Time': task.startTime ? formatTime(task.startTime) : '-',
    'End Time': task.endTime ? formatTime(task.endTime) : '-',
    'Duration (HH:MM)': task.duration ? formatDuration(task.duration) : '-',
    'Status': task.status || 'pending',
  }));

  const tasksSheet = XLSX.utils.json_to_sheet(excelTasks);
  XLSX.utils.book_append_sheet(wb, tasksSheet, 'Tasks');

  const fileName = `Weekly_Summary_${formatDate(startDate, 'yyyy-MM-dd')}_to_${formatDate(endDate, 'yyyy-MM-dd')}.xlsx`;
  XLSX.writeFile(wb, fileName);
}
