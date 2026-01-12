import { Router, Response } from 'express';
import { getConnection } from '../db/pool';
import { authenticateToken, AuthRequest, requireAdmin } from '../middleware/auth';

const router = Router();

// All routes require authentication and admin role
router.use(authenticateToken);
router.use(requireAdmin);

// Get all users
router.get('/users', async (req: AuthRequest, res: Response) => {
  try {
    const pool = await getConnection();
    const result = await pool.request().query(
      'SELECT id, email, name, role, created_at FROM users ORDER BY created_at DESC'
    );

    const users = result.recordset.map((row) => ({
      id: row.id,
      email: row.email,
      name: row.name,
      role: row.role,
      createdAt: row.created_at,
    }));

    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get user statistics
router.get('/users/:userId/stats', async (req: AuthRequest, res: Response) => {
  const { userId } = req.params;

  try {
    const pool = await getConnection();
    const tasksResult = await pool.request()
      .input('userId', userId)
      .query(
        "SELECT COUNT(*) as total, SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed FROM tasks WHERE user_id = @userId"
      );

    const projectsResult = await pool.request()
      .input('userId', userId)
      .query('SELECT COUNT(*) as total FROM projects WHERE user_id = @userId');

    const stats = {
      totalTasks: parseInt(tasksResult.recordset[0].total),
      completedTasks: parseInt(tasksResult.recordset[0].completed || '0'),
      totalProjects: parseInt(projectsResult.recordset[0].total),
    };

    res.json(stats);
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all tasks for a specific user
router.get('/users/:userId/tasks', async (req: AuthRequest, res) => {
  const { userId } = req.params;

  try {
    const pool = await getConnection();
    const result = await pool.request()
      .input('userId', userId)
      .query(
        `SELECT t.id, t.title, t.description, t.type, t.project_id, t.date, t.start_time, t.end_time, 
                t.duration, t.status, t.created_at, p.name as project_name, p.color as project_color
         FROM tasks t
         LEFT JOIN projects p ON t.project_id = p.id
         WHERE t.user_id = @userId
         ORDER BY t.date DESC, t.created_at DESC`
      );

    const tasks = result.recordset.map((row) => ({
      id: row.id,
      title: row.title,
      description: row.description,
      type: row.type,
      projectId: row.project_id,
      projectName: row.project_name,
      projectColor: row.project_color,
      date: row.date,
      startTime: row.start_time,
      endTime: row.end_time,
      duration: row.duration,
      status: row.status,
      createdAt: row.created_at,
    }));

    res.json(tasks);
  } catch (error) {
    console.error('Get user tasks error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all tasks across all users (overview)
router.get('/tasks/all', async (req: AuthRequest, res) => {
  try {
    const pool = await getConnection();
    const result = await pool.request().query(
      `SELECT TOP 100 t.id, t.title, t.description, t.type, t.date, t.status, t.duration,
              u.name as user_name, u.email as user_email,
              p.name as project_name, p.color as project_color
       FROM tasks t
       JOIN users u ON t.user_id = u.id
       LEFT JOIN projects p ON t.project_id = p.id
       ORDER BY t.date DESC, t.created_at DESC`
    );

    const tasks = result.recordset.map((row) => ({
      id: row.id,
      title: row.title,
      description: row.description,
      type: row.type,
      date: row.date,
      status: row.status,
      duration: row.duration,
      userName: row.user_name,
      userEmail: row.user_email,
      projectName: row.project_name,
      projectColor: row.project_color,
    }));

    res.json(tasks);
  } catch (error) {
    console.error('Get all tasks error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update user role
router.patch('/users/:userId/role', async (req: AuthRequest, res: Response) => {
  const { userId } = req.params;
  const { role } = req.body;

  if (!['user', 'admin'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role' });
  }

  try {
    const pool = await getConnection();
    const result = await pool.request()
      .input('role', role)
      .input('userId', userId)
      .query(
        'UPDATE users SET role = @role OUTPUT INSERTED.id, INSERTED.email, INSERTED.name, INSERTED.role WHERE id = @userId'
      );

    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(result.recordset[0]);
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
