import { apiService } from './api';
import type { Task, Project } from '../types';

// Task operations
export async function addTask(task: any) {
  const taskData = {
    title: task.title,
    description: task.description || '',
    type: task.type,
    projectId: task.projectId,
    date: task.date.toISOString().split('T')[0],
    startTime: task.startTime || null,
    endTime: task.endTime || null,
    duration: task.duration || null,
    status: task.status || 'pending',
  };
  
  const response = await apiService.createTask(taskData);
  
  return {
    id: String(response.id),
    ...task,
    createdAt: new Date(response.createdAt),
  };
}

export async function updateTask(id: string, updates: Partial<Task>) {
  const taskData: any = {};
  
  if (updates.title) taskData.title = updates.title;
  if (updates.description !== undefined) taskData.description = updates.description;
  if (updates.type) taskData.type = updates.type;
  if (updates.projectId) taskData.projectId = updates.projectId;
  if (updates.date) taskData.date = updates.date.toISOString().split('T')[0];
  if (updates.startTime !== undefined) taskData.startTime = updates.startTime;
  if (updates.endTime !== undefined) taskData.endTime = updates.endTime;
  if (updates.duration !== undefined) taskData.duration = updates.duration;
  if (updates.status) taskData.status = updates.status;
  
  await apiService.updateTask(parseInt(id), taskData);
}

export async function deleteTask(id: string) {
  await apiService.deleteTask(parseInt(id));
}

export async function getTask(id: string) {
  const tasks = await apiService.getTasks();
  return tasks.find(t => String(t.id) === id);
}

export async function getAllTasks() {
  const tasks = await apiService.getTasks();
  return tasks.map(task => ({
    id: String(task.id),
    title: task.title,
    description: task.description || '',
    type: task.type,
    projectId: task.projectId,
    date: new Date(task.date),
    startTime: task.startTime || undefined,
    endTime: task.endTime || undefined,
    duration: task.duration || undefined,
    status: task.status,
    createdAt: new Date(task.createdAt),
  }));
}

export async function getTasksByDate(date: Date) {
  const tasks = await getAllTasks();
  const targetDate = date.toISOString().split('T')[0];
  return tasks.filter(task => task.date.toISOString().split('T')[0] === targetDate);
}

export async function getTasksByDateRange(startDate: Date, endDate: Date) {
  const tasks = await getAllTasks();
  return tasks.filter(task => task.date >= startDate && task.date <= endDate);
}

export async function getTasksByType(type: 'work' | 'personal') {
  const tasks = await getAllTasks();
  return tasks.filter(task => task.type === type);
}

export async function getTasksByProject(projectId: string) {
  const tasks = await getAllTasks();
  return tasks.filter(task => task.projectId === projectId);
}

export async function getCompletedTasks() {
  const tasks = await getAllTasks();
  return tasks.filter(task => task.status === 'completed');
}

// Project operations
export async function addProject(project: any) {
  const projectData = {
    name: project.name,
    color: project.color,
    type: project.type,
  };
  
  const response = await apiService.createProject(projectData);
  
  return {
    id: String(response.id),
    ...project,
    createdAt: new Date(response.createdAt),
  };
}

export async function updateProject(id: string, updates: Partial<Project>) {
  const projectData: any = {};
  
  if (updates.name) projectData.name = updates.name;
  if (updates.color) projectData.color = updates.color;
  if (updates.type) projectData.type = updates.type;
  
  await apiService.updateProject(parseInt(id), projectData);
}

export async function deleteProject(id: string) {
  await apiService.deleteProject(parseInt(id));
}

export async function getProject(id: string) {
  const projects = await apiService.getProjects();
  return projects.find(p => String(p.id) === id);
}

export async function getAllProjects() {
  const projects = await apiService.getProjects();
  return projects.map(project => ({
    id: String(project.id),
    name: project.name,
    color: project.color,
    type: project.type,
    createdAt: new Date(project.createdAt),
  }));
}

export async function getProjectsByType(type: 'work' | 'personal') {
  const projects = await getAllProjects();
  return projects.filter(project => project.type === type);
}

// Notification Settings operations (kept local for now)
let cachedNotificationSettings: any = null;

export async function updateNotificationSettings(settings: any) {
  cachedNotificationSettings = settings;
  localStorage.setItem('notificationSettings', JSON.stringify(settings));
}

export async function getNotificationSettings() {
  if (cachedNotificationSettings) {
    return cachedNotificationSettings;
  }
  
  const saved = localStorage.getItem('notificationSettings');
  if (saved) {
    cachedNotificationSettings = JSON.parse(saved);
    return cachedNotificationSettings;
  }
  
  const settings = {
    id: 'default',
    enabled: true,
    time: '20:00',
    daysEnabled: [true, true, true, true, true, true, true],
  };
  
  cachedNotificationSettings = settings;
  localStorage.setItem('notificationSettings', JSON.stringify(settings));
  return settings;
}

// Utility functions
export async function calculateTaskDuration(startTime: Date, endTime: Date): Promise<number> {
  return Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60));
}

export async function getStatistics(startDate: Date, endDate: Date) {
  const tasks = await getTasksByDateRange(startDate, endDate);
  
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const totalDuration = tasks.reduce((sum, t) => sum + (t.duration || 0), 0);
  const workDuration = tasks
    .filter(t => t.type === 'work')
    .reduce((sum, t) => sum + (t.duration || 0), 0);
  const personalDuration = tasks
    .filter(t => t.type === 'personal')
    .reduce((sum, t) => sum + (t.duration || 0), 0);

  const projectBreakdown: { [projectId: string]: number } = {};
  tasks.forEach(task => {
    if (task.projectId) {
      projectBreakdown[task.projectId] = (projectBreakdown[task.projectId] || 0) + (task.duration || 0);
    }
  });

  return {
    totalTasks,
    completedTasks,
    totalDuration,
    workDuration,
    personalDuration,
    projectBreakdown,
  };
}

// Clear all data (for development/testing)
export async function clearAllData() {
  // Since we're using a backend API now, this would need to delete all tasks and projects via API
  // For now, we'll just throw an error indicating this isn't implemented
  throw new Error('Clear all data not implemented for backend API');
}
