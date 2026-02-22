const { Pool } = require('pg');
const path = require('path');

// Configuración para producción (Render) o desarrollo local
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
});

// Inicializar tablas
async function initializeTables() {
  try {
    // Tabla de usuarios
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tabla de citas
    await pool.query(`
      CREATE TABLE IF NOT EXISTS appointments (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        date TEXT NOT NULL,
        time TEXT NOT NULL,
        service_type TEXT NOT NULL,
        image_url TEXT,
        notes TEXT,
        admin_notes TEXT,
        status TEXT DEFAULT 'pendiente',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    console.log('✓ Tablas inicializadas correctamente en PostgreSQL');
  } catch (err) {
    console.error('Error inicializando tablas:', err.message);
  }
}

// Iniciar tablas al cargar
initializeTables();

module.exports = pool;
