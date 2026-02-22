const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Appointment = require('../models/Appointment');
const { authMiddleware } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Validaciones
const appointmentValidation = [
  body('date').notEmpty().withMessage('La fecha es requerida'),
  body('time').notEmpty().withMessage('La hora es requerida'),
  body('serviceType').notEmpty().withMessage('El tipo de servicio es requerido')
];

// GET /api/appointments - Obtener citas del usuario
router.get('/', authMiddleware, async (req, res) => {
  try {
    const appointments = await Appointment.getByUserId(req.user.id);
    res.json(appointments);
  } catch (error) {
    console.error('Error al obtener citas:', error);
    res.status(500).json({ error: 'Error al obtener citas' });
  }
});

// POST /api/appointments - Crear nueva cita
router.post('/', authMiddleware, upload.single('image'), appointmentValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { date, time, serviceType, notes } = req.body;

    // Verificar disponibilidad
    const isAvailable = await Appointment.checkAvailability(date, time);
    if (!isAvailable) {
      return res.status(400).json({ error: 'El horario seleccionado no está disponible' });
    }

    // Crear cita
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;
    const appointment = await Appointment.create(req.user.id, {
      date,
      time,
      serviceType,
      imageUrl,
      notes
    });

    res.status(201).json({
      message: 'Cita agendada exitosamente',
      appointment
    });
  } catch (error) {
    console.error('Error al crear cita:', error);
    res.status(500).json({ error: 'Error al agendar cita' });
  }
});

// PUT /api/appointments/:id/cancel - Cancelar cita
router.put('/:id/cancel', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar que la cita pertenece al usuario
    const appointment = await Appointment.getById(id);
    if (!appointment) {
      return res.status(404).json({ error: 'Cita no encontrada' });
    }
    if (appointment.user_id !== req.user.id) {
      return res.status(403).json({ error: 'No tienes permiso para cancelar esta cita' });
    }
    if (appointment.status === 'cancelada') {
      return res.status(400).json({ error: 'Esta cita ya está cancelada' });
    }

    await Appointment.cancel(id, req.user.id);
    res.json({ message: 'Cita cancelada exitosamente' });
  } catch (error) {
    console.error('Error al cancelar cita:', error);
    res.status(500).json({ error: 'Error al cancelar cita' });
  }
});

module.exports = router;
