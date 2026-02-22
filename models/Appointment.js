const db = require('../config/database');

class Appointment {
  // Crear cita
  static create(userId, data) {
    return new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO appointments (user_id, date, time, service_type, image_url, notes, status) 
         VALUES (?, ?, ?, ?, ?, ?, 'pendiente')`,
        [userId, data.date, data.time, data.serviceType, data.imageUrl || null, data.notes || null],
        function(err) {
          if (err) reject(err);
          resolve({ id: this.lastID, userId, ...data, status: 'pendiente' });
        }
      );
    });
  }

  // Obtener citas de un usuario
  static getByUserId(userId) {
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT a.*, u.name as user_name, u.email as user_email 
         FROM appointments a 
         JOIN users u ON a.user_id = u.id 
         WHERE a.user_id = ? 
         ORDER BY a.date DESC, a.time DESC`,
        [userId],
        (err, rows) => {
          if (err) reject(err);
          resolve(rows);
        }
      );
    });
  }

  // Obtener cita por ID
  static getById(id) {
    return new Promise((resolve, reject) => {
      db.get(
        `SELECT a.*, u.name as user_name, u.email as user_email 
         FROM appointments a 
         JOIN users u ON a.user_id = u.id 
         WHERE a.id = ?`,
        [id],
        (err, row) => {
          if (err) reject(err);
          resolve(row);
        }
      );
    });
  }

  // Obtener todas las citas (admin)
  static getAll() {
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT a.*, u.name as user_name, u.email as user_email 
         FROM appointments a 
         JOIN users u ON a.user_id = u.id 
         ORDER BY a.date DESC, a.time DESC`,
        (err, rows) => {
          if (err) reject(err);
          resolve(rows);
        }
      );
    });
  }

  // Verificar disponibilidad de horario
  static checkAvailability(date, time) {
    return new Promise((resolve, reject) => {
      db.get(
        'SELECT id FROM appointments WHERE date = ? AND time = ? AND status != "cancelada"',
        [date, time],
        (err, row) => {
          if (err) reject(err);
          resolve(!row); // true si está disponible
        }
      );
    });
  }

  // Actualizar estado de cita
  static updateStatus(id, status) {
    return new Promise((resolve, reject) => {
      db.run(
        'UPDATE appointments SET status = ? WHERE id = ?',
        [status, id],
        function(err) {
          if (err) reject(err);
          resolve({ id, status });
        }
      );
    });
  }

  // Actualizar notas del empleado/admin
  static updateAdminNotes(id, adminNotes) {
    return new Promise((resolve, reject) => {
      db.run(
        'UPDATE appointments SET admin_notes = ? WHERE id = ?',
        [adminNotes, id],
        function(err) {
          if (err) reject(err);
          resolve({ id, admin_notes: adminNotes });
        }
      );
    });
  }

  // Cancelar cita
  static cancel(id, userId) {
    return new Promise((resolve, reject) => {
      db.run(
        'UPDATE appointments SET status = "cancelada" WHERE id = ? AND user_id = ?',
        [id, userId],
        function(err) {
          if (err) reject(err);
          resolve({ id, status: 'cancelada' });
        }
      );
    });
  }

  // Obtener estadísticas para dashboard admin
  static getStats() {
    return new Promise((resolve, reject) => {
      const stats = {};
      
      db.get('SELECT COUNT(*) as total FROM appointments', [], (err, row) => {
        if (err) reject(err);
        stats.total = row.total;
        
        db.get('SELECT COUNT(*) as total FROM appointments WHERE status = "pendiente"', [], (err, row) => {
          if (err) reject(err);
          stats.pending = row.total;
          
          db.get('SELECT COUNT(*) as total FROM appointments WHERE status = "confirmada"', [], (err, row) => {
            if (err) reject(err);
            stats.confirmed = row.total;
            
            db.get('SELECT COUNT(*) as total FROM appointments WHERE status = "completada"', [], (err, row) => {
              if (err) reject(err);
              stats.completed = row.total;
              
              db.get('SELECT COUNT(*) as total FROM appointments WHERE status = "cancelada"', [], (err, row) => {
                if (err) reject(err);
                stats.cancelled = row.total;
                
                // Citas por servicio
                db.all(
                  'SELECT service_type, COUNT(*) as count FROM appointments GROUP BY service_type',
                  [],
                  (err, rows) => {
                    if (err) reject(err);
                    stats.byService = rows;
                    
                    // Citas por día (últimos 7 días)
                    db.all(
                      `SELECT date, COUNT(*) as count FROM appointments 
                       WHERE date >= date('now', '-7 days') 
                       GROUP BY date ORDER BY date`,
                      [],
                      (err, rows) => {
                        if (err) reject(err);
                        stats.byDay = rows;
                        
                        // Citas de hoy
                        db.get(
                          `SELECT COUNT(*) as total FROM appointments WHERE date = date('now')`,
                          [],
                          (err, row) => {
                            if (err) reject(err);
                            stats.today = row.total;
                            resolve(stats);
                          }
                        );
                      }
                    );
                  }
                );
              });
            });
          });
        });
      });
    });
  }

  // Contar usuarios que han reservado
  static getUniqueUsers() {
    return new Promise((resolve, reject) => {
      db.get(
        'SELECT COUNT(DISTINCT user_id) as total FROM appointments',
        [],
        (err, row) => {
          if (err) reject(err);
          resolve(row.total);
        }
      );
    });
  }
}

module.exports = Appointment;
