import { getConnection, sql } from './pool';

export async function migrate() {
  try {
    const pool = await getConnection();

    console.log('Starting database migration...');

    // Users table
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='users' AND xtype='U')
      CREATE TABLE users (
        id INT IDENTITY(1,1) PRIMARY KEY,
        email NVARCHAR(255) UNIQUE NOT NULL,
        password NVARCHAR(255) NOT NULL,
        name NVARCHAR(255) NOT NULL,
        role NVARCHAR(50) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
        created_at DATETIME2 DEFAULT GETDATE()
      )
    `);

    // Projects table
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='projects' AND xtype='U')
      CREATE TABLE projects (
        id INT IDENTITY(1,1) PRIMARY KEY,
        name NVARCHAR(255) NOT NULL,
        color NVARCHAR(50) NOT NULL,
        type NVARCHAR(50) NOT NULL CHECK (type IN ('work', 'personal')),
        user_id INT,
        created_at DATETIME2 DEFAULT GETDATE(),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Tasks table
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='tasks' AND xtype='U')
      CREATE TABLE tasks (
        id INT IDENTITY(1,1) PRIMARY KEY,
        title NVARCHAR(255) NOT NULL,
        description NVARCHAR(MAX),
        type NVARCHAR(50) NOT NULL CHECK (type IN ('work', 'personal')),
        project_id INT,
        user_id INT NOT NULL,
        date DATE NOT NULL,
        start_time TIME,
        end_time TIME,
        duration INT,
        status NVARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
        created_at DATETIME2 DEFAULT GETDATE(),
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE NO ACTION
      )
    `);

    // Notification settings table
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='notification_settings' AND xtype='U')
      CREATE TABLE notification_settings (
        id INT IDENTITY(1,1) PRIMARY KEY,
        user_id INT UNIQUE,
        enabled BIT DEFAULT 1,
        time NVARCHAR(5) DEFAULT '20:00',
        created_at DATETIME2 DEFAULT GETDATE(),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Create indexes for better performance
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name='idx_tasks_user_id')
      CREATE INDEX idx_tasks_user_id ON tasks(user_id)
    `);

    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name='idx_tasks_date')
      CREATE INDEX idx_tasks_date ON tasks(date)
    `);

    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name='idx_projects_user_id')
      CREATE INDEX idx_projects_user_id ON projects(user_id)
    `);

    console.log('Database migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  migrate()
    .then(() => {
      console.log('Migration completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}
