import { Router, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { getConnection } from '../db/pool';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Get all tasks for current user
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const pool = await getConnection();
    const result = await pool
      .request()
      .input('userId', req.userId)
      .query(`
        SELECT id, title, description, type, project_id, date, start_time, end_time, duration, status, created_at 
        FROM tasks WHERE user_id = @userId ORDER BY date DESC, created_at DESC
      `);

    const tasks = result.recordset.map((row) => ({
      id: row.id,
      title: row.title,
      description: row.description,
      type: row.type,
      projectId: row.project_id,
      date: row.date,
      startTime: row.start_time,
      endTime: row.end_time,
      duration: row.duration,
      status: row.status,
      createdAt: row.created_at,
    }));

    res.json(tasks);
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create task
router.post(
  '/',
  [
    body('title').trim().notEmpty(),
    body('type').isIn(['work', 'personal']),
    body('projectId').isInt(),
    body('date').isISO8601(),
  ],
  async (req: AuthRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, description, type, projectId, date, startTime, endTime, duration, status } = req.body;

    try {
      const pool = await getConnection();

      // Verify project belongs to user
      const projectCheck = await pool
        .request()
        .input('projectId', projectId)
        .input('userId', req.userId)
        .query('SELECT id FROM projects WHERE id = @projectId AND user_id = @userId');

      if (projectCheck.recordset.length === 0) {
        return res.status(400).json({ error: 'Invalid project' });
      }

      const result = await pool
        .request()
        .input('title', title)
        .input('description', description || null)
        .input('type', type)
        .input('projectId', projectId)
        .input('userId', req.userId)
        .input('date', date)
        .input('startTime', startTime || null)
        .input('endTime', endTime || null)
        .input('duration', duration || null)
        .input('status', status || 'pending')
        .query(`
          INSERT INTO tasks (title, description, type, project_id, user_id, date, start_time, end_time, duration, status)
          OUTPUT INSERTED.id, INSERTED.title, INSERTED.description, INSERTED.type, INSERTED.project_id, 
                 INSERTED.date, INSERTED.start_time, INSERTED.end_time, INSERTED.duration, INSERTED.status, INSERTED.created_at
          VALUES (@title, @description, @type, @projectId, @userId, @date, @startTime, @endTime, @duration, @status)
        `);

      const task = result.recordset[0];

      res.status(201).json({
        id: task.id,
        title: task.title,
        description: task.description,
        type: task.type,
        projectId: task.project_id,
        date: task.date,
        startTime: task.start_time,
        endTime: task.end_time,
        duration: task.duration,
        status: task.status,
        createdAt: task.created_at,
      });
    } catch (error) {
      console.error('Create task error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

// Update task
router.put('/:id', async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { title, description, type, projectId, date, startTime, endTime, duration, status } = req.body;

  try {
    const pool = await getConnection();

    // Verify project belongs to user if projectId is being updated
    if (projectId) {
      const projectCheck = await pool
        .request()
        .input('projectId', projectId)
        .input('userId', req.userId)
        .query('SELECT id FROM projects WHERE id = @projectId AND user_id = @userId');

      if (projectCheck.recordset.length === 0) {
        return res.status(400).json({ error: 'Invalid project' });
      }
    }

    const result = await pool
      .request()
      .input('title', title)
      .input('description', description)
      .input('type', type)
      .input('projectId', projectId)
      .input('date', date)
      .input('startTime', startTime)
      .input('endTime', endTime)
      .input('duration', duration)
      .input('status', status)
      .input('id', id)
      .input('userId', req.userId)
      .query(`
        UPDATE tasks 
        SET title = @title, description = @description, type = @type, project_id = @projectId, date = @date, 
            start_time = @startTime, end_time = @endTime, duration = @duration, status = @status
        OUTPUT INSERTED.id, INSERTED.title, INSERTED.description, INSERTED.type, INSERTED.project_id, 
               INSERTED.date, INSERTED.start_time, INSERTED.end_time, INSERTED.duration, INSERTED.status, INSERTED.created_at
        WHERE id = @id AND user_id = @userId
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const task = result.recordset[0];

    res.json({
      id: task.id,
      title: task.title,
      description: task.description,
      type: task.type,
      projectId: task.project_id,
      date: task.date,
      startTime: task.start_time,
      endTime: task.end_time,
      duration: task.duration,
      status: task.status,
      createdAt: task.created_at,
    });
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete task
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  try {
    const pool = await getConnection();
    const result = await pool
      .request()
      .input('id', id)
      .input('userId', req.userId)
      .query('DELETE FROM tasks WHERE id = @id AND user_id = @userId; SELECT @@ROWCOUNT AS rowsAffected');

    if (result.recordset[0].rowsAffected === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
