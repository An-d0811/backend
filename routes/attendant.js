const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Appointment = require('../models/Appointment');
const { authMiddleware, attendantMiddleware } = require('../middleware/auth');

// Aplicar middleware de autenticación y attendant a todas las rutas
router.use(authMiddleware, attendantMiddleware);

// GET /api/attendant/appointments - Obtener todas las citas
router.get('/appointments', async (req, res) => {
  try {
    const appointments = await Appointment.getAll();
    res.json(appointments);
  } catch (error) {
    console.error('Error al obtener todas las citas:', error);
    res.status(500).json({ error: 'Error al obtener citas' });
  }
});

// GET /api/attendant/appointments/today - Obtener citas de hoy
router.get('/appointments/today', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const appointments = await Appointment.getAll();
    const todayAppointments = appointments.filter(apt => apt.date === today);
    res.json(todayAppointments);
  } catch (error) {
    console.error('Error al obtener citas de hoy:', error);
    res.status(500).json({ error: 'Error al obtener citas de hoy' });
  }
});

// PUT /api/attendant/appointments/:id/status - Actualizar estado de cita
router.put('/appointments/:id/status', [
  body('status').isIn(['pendiente', 'confirmada', 'cancelada', 'completada']).withMessage('Estado inválido')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { status } = req.body;

    const appointment = await Appointment.getById(id);
    if (!appointment) {
      return res.status(404).json({ error: 'Cita no encontrada' });
    }

    await Appointment.updateStatus(id, status);
    res.json({ message: 'Estado de cita actualizado', id, status });
  } catch (error) {
    console.error('Error al actualizar estado:', error);
    res.status(500).json({ error: 'Error al actualizar estado de cita' });
  }
});

// PUT /api/attendant/appointments/:id/notes - Actualizar notas del empleado
router.put('/appointments/:id/notes', [
  body('adminNotes').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { adminNotes } = req.body;

    const appointment = await Appointment.getById(id);
    if (!appointment) {
      return res.status(404).json({ error: 'Cita no encontrada' });
    }

    await Appointment.updateAdminNotes(id, adminNotes || '');
    res.json({ message: 'Notas actualizadas', id, admin_notes: adminNotes });
  } catch (error) {
    console.error('Error al actualizar notas:', error);
    res.status(500).json({ error: 'Error al actualizar notas' });
  }
});

module.exports = router;
