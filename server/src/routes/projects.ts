import { Router, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { getConnection } from '../db/pool';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

router.use(authenticateToken);

// Get all projects for current user
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const pool = await getConnection();
    const result = await pool.request()
      .input('user_id', req.userId)
      .query(`
        SELECT id, name, color, type, created_at 
        FROM projects 
        WHERE user_id = @user_id 
        ORDER BY created_at DESC
      `);

    const projects = result.recordset.map((row) => ({
      id: row.id,
      name: row.name,
      color: row.color,
      type: row.type,
      createdAt: row.created_at,
    }));

    res.json(projects);
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create project
router.post(
  '/',
  [
    body('name').trim().notEmpty(),
    body('color').trim().notEmpty(),
    body('type').isIn(['work', 'personal']),
  ],
  async (req: AuthRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, color, type } = req.body;

    try {
      const pool = await getConnection();
      const result = await pool.request()
        .input('name', name)
        .input('color', color)
        .input('type', type)
        .input('user_id', req.userId)
        .query(`
          INSERT INTO projects (name, color, type, user_id) 
          OUTPUT INSERTED.id, INSERTED.name, INSERTED.color, INSERTED.type, INSERTED.created_at
          VALUES (@name, @color, @type, @user_id)
        `);

      const project = result.recordset[0];

      res.status(201).json({
        id: project.id,
        name: project.name,
        color: project.color,
        type: project.type,
        createdAt: project.created_at,
      });
    } catch (error) {
      console.error('Create project error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

// Update project
router.put('/:id', async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { name, color, type } = req.body;

  try {
    const pool = await getConnection();
    const result = await pool.request()
      .input('name', name)
      .input('color', color)
      .input('type', type)
      .input('id', id)
      .input('user_id', req.userId)
      .query(`
        UPDATE projects 
        SET name = @name, color = @color, type = @type 
        OUTPUT INSERTED.id, INSERTED.name, INSERTED.color, INSERTED.type, INSERTED.created_at
        WHERE id = @id AND user_id = @user_id
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const project = result.recordset[0];

    res.json({
      id: project.id,
      name: project.name,
      color: project.color,
      type: project.type,
      createdAt: project.created_at,
    });
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete project
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  try {
    const pool = await getConnection();
    const result = await pool.request()
      .input('id', id)
      .input('user_id', req.userId)
      .query('DELETE FROM projects WHERE id = @id AND user_id = @user_id; SELECT @@ROWCOUNT as affected');

    if (result.recordset[0].affected === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
