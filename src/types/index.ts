export interface Task {
  id: string;
  title: string;
  description: string;
  type: 'work' | 'personal';
  projectId?: string;
  startTime?: Date;
  endTime?: Date;
  date: Date;
  duration?: number; // in minutes
  status: string;
  createdAt: Date;
}

export interface Project {
  id: string;
  name: string;
  type: 'work' | 'personal';
  color: string;
  createdAt: Date;
}

export interface NotificationSettings {
  id: string;
  enabled: boolean;
  time: string; // HH:MM format
  daysEnabled: boolean[];
}

export interface ExportConfig {
  startDate: Date;
  endDate: Date;
  type?: 'work' | 'personal' | 'all';
  includeProjects: boolean;
  includeStatistics: boolean;
}

export interface TaskStatistics {
  totalTasks: number;
  completedTasks: number;
  totalDuration: number;
  workDuration: number;
  personalDuration: number;
  projectBreakdown: { [projectId: string]: number };
}
