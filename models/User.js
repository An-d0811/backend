const pool = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
  // Buscar usuario por email
  static async findByEmail(email) {
    try {
      const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
      return result.rows[0];
    } catch (err) {
      console.error('Error finding user by email:', err);
      throw err;
    }
  }

  // Buscar usuario por ID
  static async findById(id) {
    try {
      const result = await pool.query('SELECT id, name, email, role, created_at FROM users WHERE id = $1', [id]);
      return result.rows[0];
    } catch (err) {
      console.error('Error finding user by id:', err);
      throw err;
    }
  }

  // Crear nuevo usuario
  static async create(name, email, password, role = 'user') {
    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const result = await pool.query(
        'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role',
        [name, email, hashedPassword, role]
      );
      return result.rows[0];
    } catch (err) {
      console.error('Error creating user:', err);
      throw err;
    }
  }

  // Verificar contraseña
  static async verifyPassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  // Obtener todos los usuarios (admin)
  static async getAll() {
    try {
      const result = await pool.query('SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC');
      return result.rows;
    } catch (err) {
      console.error('Error getting all users:', err);
      throw err;
    }
  }

  // Contar usuarios por rol
  static async countByRole() {
    try {
      const result = await pool.query('SELECT role, COUNT(*) as count FROM users GROUP BY role');
      return result.rows;
    } catch (err) {
      console.error('Error counting users by role:', err);
      throw err;
    }
  }

  // Actualizar usuario (nombre y rol)
  static async update(id, name, role) {
    try {
      const updates = [];
      const params = [];
      let paramIndex = 1;

      if (name !== undefined) {
        updates.push(`name = $${paramIndex++}`);
        params.push(name);
      }
      if (role !== undefined) {
        updates.push(`role = $${paramIndex++}`);
        params.push(role);
      }

      if (updates.length === 0) {
        return null;
      }

      params.push(id);
      const result = await pool.query(
        `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
        params
      );
      return result.rows[0];
    } catch (err) {
      console.error('Error updating user:', err);
      throw err;
    }
  }
}

module.exports = User;
