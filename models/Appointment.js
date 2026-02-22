const pool = require('../config/database');

class Appointment {
  // Crear cita
  static async create(userId, data) {
    try {
      const result = await pool.query(
        `INSERT INTO appointments (user_id, date, time, service_type, image_url, notes, status) 
         VALUES ($1, $2, $3, $4, $5, $6, 'pendiente') RETURNING *`,
        [userId, data.date, data.time, data.serviceType, data.imageUrl || null, data.notes || null]
      );
      return result.rows[0];
    } catch (err) {
      console.error('Error creating appointment:', err);
      throw err;
    }
  }

  // Obtener citas de un usuario
  static async getByUserId(userId) {
    try {
      const result = await pool.query(
        `SELECT a.*, u.name as user_name, u.email as user_email 
         FROM appointments a 
         JOIN users u ON a.user_id = u.id 
         WHERE a.user_id = $1 
         ORDER BY a.date DESC, a.time DESC`,
        [userId]
      );
      return result.rows;
    } catch (err) {
      console.error('Error getting appointments by user:', err);
      throw err;
    }
  }

  // Obtener cita por ID
  static async getById(id) {
    try {
      const result = await pool.query(
        `SELECT a.*, u.name as user_name, u.email as user_email 
         FROM appointments a 
         JOIN users u ON a.user_id = u.id 
         WHERE a.id = $1`,
        [id]
      );
      return result.rows[0];
    } catch (err) {
      console.error('Error getting appointment by id:', err);
      throw err;
    }
  }

  // Obtener todas las citas (admin)
  static async getAll() {
    try {
      const result = await pool.query(
        `SELECT a.*, u.name as user_name, u.email as user_email 
         FROM appointments a 
         JOIN users u ON a.user_id = u.id 
         ORDER BY a.date DESC, a.time DESC`
      );
      return result.rows;
    } catch (err) {
      console.error('Error getting all appointments:', err);
      throw err;
    }
  }

  // Verificar disponibilidad de horario
  static async checkAvailability(date, time) {
    try {
      const result = await pool.query(
        'SELECT id FROM appointments WHERE date = $1 AND time = $2 AND status != $3',
        [date, time, 'cancelada']
      );
      return result.rows.length === 0; // true si está disponible
    } catch (err) {
      console.error('Error checking availability:', err);
      throw err;
    }
  }

  // Actualizar estado de cita
  static async updateStatus(id, status) {
    try {
      const result = await pool.query(
        'UPDATE appointments SET status = $1 WHERE id = $2 RETURNING *',
        [status, id]
      );
      return result.rows[0];
    } catch (err) {
      console.error('Error updating appointment status:', err);
      throw err;
    }
  }

  // Actualizar notas del empleado/admin
  static async updateAdminNotes(id, adminNotes) {
    try {
      const result = await pool.query(
        'UPDATE appointments SET admin_notes = $1 WHERE id = $2 RETURNING *',
        [adminNotes, id]
      );
      return result.rows[0];
    } catch (err) {
      console.error('Error updating admin notes:', err);
      throw err;
    }
  }

  // Cancelar cita
  static async cancel(id, userId) {
    try {
      const result = await pool.query(
        'UPDATE appointments SET status = $1 WHERE id = $2 AND user_id = $3 RETURNING *',
        ['cancelada', id, userId]
      );
      return result.rows[0];
    } catch (err) {
      console.error('Error cancelling appointment:', err);
      throw err;
    }
  }

  // Obtener estadísticas para dashboard admin
  static async getStats() {
    try {
      const stats = {};

      // Total de citas
      let result = await pool.query('SELECT COUNT(*) as total FROM appointments');
      stats.total = parseInt(result.rows[0].total);

      // Citas pendientes
      result = await pool.query('SELECT COUNT(*) as total FROM appointments WHERE status = $1', ['pendiente']);
      stats.pending = parseInt(result.rows[0].total);

      // Citas confirmadas
      result = await pool.query('SELECT COUNT(*) as total FROM appointments WHERE status = $1', ['confirmada']);
      stats.confirmed = parseInt(result.rows[0].total);

      // Citas completadas
      result = await pool.query('SELECT COUNT(*) as total FROM appointments WHERE status = $1', ['completada']);
      stats.completed = parseInt(result.rows[0].total);

      // Citas canceladas
      result = await pool.query('SELECT COUNT(*) as total FROM appointments WHERE status = $1', ['cancelada']);
      stats.cancelled = parseInt(result.rows[0].total);

      // Citas por servicio
      result = await pool.query('SELECT service_type, COUNT(*) as count FROM appointments GROUP BY service_type');
      stats.byService = result.rows;

      // Citas por día (últimos 7 días)
      result = await pool.query(
        `SELECT date, COUNT(*) as count FROM appointments 
         WHERE date >= CURRENT_DATE - INTERVAL '7 days' 
         GROUP BY date ORDER BY date`
      );
      stats.byDay = result.rows;

      // Citas de hoy
      result = await pool.query(
        "SELECT COUNT(*) as total FROM appointments WHERE date = CURRENT_DATE"
      );
      stats.today = parseInt(result.rows[0].total);

      // Usuarios únicos
      result = await pool.query('SELECT COUNT(DISTINCT user_id) as total FROM appointments');
      stats.uniqueUsers = parseInt(result.rows[0].total);

      return stats;
    } catch (err) {
      console.error('Error getting stats:', err);
      throw err;
    }
  }

  // Contar usuarios que han reservado
  static async getUniqueUsers() {
    try {
      const result = await pool.query('SELECT COUNT(DISTINCT user_id) as total FROM appointments');
      return parseInt(result.rows[0].total);
    } catch (err) {
      console.error('Error getting unique users:', err);
      throw err;
    }
  }
}

module.exports = Appointment;
