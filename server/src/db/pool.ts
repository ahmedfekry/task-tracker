import sql from 'mssql';
import dotenv from 'dotenv';

dotenv.config();

// Parse server configuration: SERVER\INSTANCE or SERVER,PORT or just SERVER
const dbServer = process.env.DB_SERVER || 'localhost';
let server = dbServer;
let instance: string | undefined;
let port: number | undefined = process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : undefined;

// Check if it contains instance name (SERVER\INSTANCE)
if (dbServer.includes('\\')) {
  const parts = dbServer.split('\\');
  server = parts[0];
  instance = parts[1];
}
// Check if it contains port (SERVER,PORT)
else if (dbServer.includes(',')) {
  const parts = dbServer.split(',');
  server = parts[0];
  port = parseInt(parts[1], 10);
}

// Use SQL Server Authentication
const config: sql.config = {
  server: server,
  database: process.env.DB_DATABASE || 'TaskTracker',
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  port: port,
  options: {
    encrypt: process.env.NODE_ENV === 'production',
    trustServerCertificate: true,
    enableArithAbort: true,
    instanceName: instance,
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};

let pool: sql.ConnectionPool;

export async function getConnection(): Promise<sql.ConnectionPool> {
  if (!pool) {
    pool = await sql.connect(config);
    console.log('Connected to SQL Server database');
  }
  return pool;
}

export { sql };
