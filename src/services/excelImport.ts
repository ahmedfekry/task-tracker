import * as XLSX from 'xlsx';
import type { Project } from '../types';
import { parseDate, parseTimeString } from '../utils/dateHelpers';
import { addTask, getAllProjects, addProject } from './database';

interface ImportedTask {
  'Task Title': string;
  'Description': string;
  'Type': string;
  'Project': string;
  'Date': string;
  'Start Time'?: string;
  'End Time'?: string;
  'Duration (HH:MM)'?: string;
  'Status'?: string;
}

export interface ImportResult {
  success: boolean;
  importedCount: number;
  failedCount: number;
  errors: string[];
  createdProjects: string[];
}

/**
 * Parse time string (HH:MM) to minutes
 */
function parseDurationToMinutes(duration: string): number | undefined {
  if (!duration || duration === '-') return undefined;
  
  const parts = duration.split(':');
  if (parts.length !== 2) return undefined;
  
  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);
  
  if (isNaN(hours) || isNaN(minutes)) return undefined;
  
  return hours * 60 + minutes;
}

/**
 * Find or create project by name
 */
async function findOrCreateProject(
  projectName: string,
  taskType: 'work' | 'personal',
  existingProjects: Map<string, Project>,
  createdProjects: Set<string>
): Promise<string | undefined> {
  if (!projectName || projectName === 'No Project' || projectName === 'N/A') {
    return undefined;
  }

  // Check if project already exists
  for (const [id, project] of existingProjects.entries()) {
    if (project.name.toLowerCase() === projectName.toLowerCase() && project.type === taskType) {
      return id;
    }
  }

  // Create new project
  try {
    const newProject = await addProject({
      name: projectName,
      type: taskType,
      color: getRandomProjectColor(),
      createdAt: new Date(),
    });
    
    existingProjects.set(newProject.id, newProject);
    createdProjects.add(projectName);
    
    return newProject.id;
  } catch (error) {
    console.error('Failed to create project:', error);
    return undefined;
  }
}

/**
 * Get random color for new projects
 */
function getRandomProjectColor(): string {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
    '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B88B', '#52B788',
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

/**
 * Import tasks from Excel file
 */
export async function importTasksFromExcel(file: File): Promise<ImportResult> {
  const result: ImportResult = {
    success: false,
    importedCount: 0,
    failedCount: 0,
    errors: [],
    createdProjects: [],
  };

  try {
    // Read the Excel file
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });

    // Get the first sheet (Tasks sheet)
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // Convert to JSON
    const data = XLSX.utils.sheet_to_json<ImportedTask>(worksheet);

    if (data.length === 0) {
      result.errors.push('No tasks found in the Excel file');
      return result;
    }

    // Get existing projects
    const allProjects = await getAllProjects();
    const projectMap = new Map(allProjects.map(p => [p.id, p]));
    const createdProjects = new Set<string>();

    // Import each task
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const rowNumber = i + 2; // +2 because Excel rows start at 1 and we have a header

      try {
        // Validate required fields
        if (!row['Task Title']) {
          result.errors.push(`Row ${rowNumber}: Task title is required`);
          result.failedCount++;
          continue;
        }

        if (!row['Type']) {
          result.errors.push(`Row ${rowNumber}: Type is required`);
          result.failedCount++;
          continue;
        }

        if (!row['Date']) {
          result.errors.push(`Row ${rowNumber}: Date is required`);
          result.failedCount++;
          continue;
        }

        // Parse task type
        const type = row['Type'].toLowerCase() === 'work' ? 'work' : 'personal';

        // Parse date
        const date = parseDate(row['Date']);
        if (!date) {
          result.errors.push(`Row ${rowNumber}: Invalid date format`);
          result.failedCount++;
          continue;
        }

        // Find or create project
        const projectId = await findOrCreateProject(
          row['Project'],
          type,
          projectMap,
          createdProjects
        );

        // Validate that project exists (now required)
        if (!projectId) {
          result.errors.push(`Row ${rowNumber}: Project is required but could not be created`);
          result.failedCount++;
          continue;
        }

        // Parse optional fields
        const startTime = row['Start Time'] && row['Start Time'] !== '-' 
          ? parseTimeString(row['Start Time']) 
          : undefined;
        
        const endTime = row['End Time'] && row['End Time'] !== '-' 
          ? parseTimeString(row['End Time']) 
          : undefined;

        const duration = row['Duration (HH:MM)'] 
          ? parseDurationToMinutes(row['Duration (HH:MM)'])
          : undefined;

        const completed = row['Status']?.toLowerCase() === 'completed';

        // Create task
        const now = new Date();
        await addTask({
          title: row['Task Title'],
          description: row['Description'] || '',
          type,
          projectId,
          date,
          startTime,
          endTime,
          duration,
          completed,
          createdAt: now,
          updatedAt: now,
        });

        result.importedCount++;
      } catch (error) {
        console.error(`Error importing row ${rowNumber}:`, error);
        result.errors.push(`Row ${rowNumber}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        result.failedCount++;
      }
    }

    result.createdProjects = Array.from(createdProjects);
    result.success = result.importedCount > 0;

    return result;
  } catch (error) {
    console.error('Error reading Excel file:', error);
    result.errors.push(`Failed to read Excel file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return result;
  }
}
