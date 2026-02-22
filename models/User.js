const db = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
  // Buscar usuario por email
  static findByEmail(email) {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM users WHERE email = ?', [email], (err, row) => {
        if (err) reject(err);
        resolve(row);
      });
    });
  }

  // Buscar usuario por ID
  static findById(id) {
    return new Promise((resolve, reject) => {
      db.get('SELECT id, name, email, role, created_at FROM users WHERE id = ?', [id], (err, row) => {
        if (err) reject(err);
        resolve(row);
      });
    });
  }

  // Crear nuevo usuario
  static create(name, email, password, role = 'user') {
    return new Promise(async (resolve, reject) => {
      try {
        const hashedPassword = await bcrypt.hash(password, 10);
        db.run(
          'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
          [name, email, hashedPassword, role],
          function(err) {
            if (err) reject(err);
            resolve({ id: this.lastID, name, email, role });
          }
        );
      } catch (error) {
        reject(error);
      }
    });
  }

  // Verificar contraseña
  static async verifyPassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  // Obtener todos los usuarios (admin)
  static getAll() {
    return new Promise((resolve, reject) => {
      db.all(
        'SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC',
        [],
        (err, rows) => {
          if (err) reject(err);
          resolve(rows);
        }
      );
    });
  }

  // Contar usuarios por rol
  static countByRole() {
    return new Promise((resolve, reject) => {
      db.all(
        'SELECT role, COUNT(*) as count FROM users GROUP BY role',
        [],
        (err, rows) => {
          if (err) reject(err);
          resolve(rows);
        }
      );
    });
  }

  // Actualizar usuario (nombre y rol)
  static update(id, name, role) {
    return new Promise((resolve, reject) => {
      // Construir consulta dinámicamente
      const updates = [];
      const params = [];

      if (name !== undefined) {
        updates.push('name = ?');
        params.push(name);
      }
      if (role !== undefined) {
        updates.push('role = ?');
        params.push(role);
      }

      if (updates.length === 0) {
        return resolve(null);
      }

      params.push(id);
      db.run(
        `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
        params,
        function(err) {
          if (err) reject(err);
          resolve({ changes: this.changes });
        }
      );
    });
  }
}

module.exports = User;
