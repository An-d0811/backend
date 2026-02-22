const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Appointment = require('../models/Appointment');
const User = require('../models/User');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

// Aplicar middleware de autenticación y admin a todas las rutas
router.use(authMiddleware, adminMiddleware);

// GET /api/admin/users - Obtener todos los usuarios
router.get('/users', async (req, res) => {
  try {
    const users = await User.getAll();
    res.json(users);
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
});

// GET /api/admin/stats - Obtener estadísticas del salón
router.get('/stats', async (req, res) => {
  try {
    const stats = await Appointment.getStats();
    const userStats = await User.countByRole();
    const uniqueUsers = await Appointment.getUniqueUsers();
    
    res.json({
      ...stats,
      usersByRole: userStats,
      uniqueUsers
    });
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
});

// POST /api/admin/users - Crear nuevo usuario (admin o attendant)
router.post('/users', [
  body('name').trim().notEmpty().withMessage('El nombre es requerido'),
  body('email').isEmail().withMessage('Correo electrónico inválido'),
  body('password').isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
  body('role').isIn(['user', 'admin', 'attendant']).withMessage('Rol inválido')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password, role } = req.body;

    // Verificar si el usuario ya existe
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: 'El correo electrónico ya está registrado' });
    }

    // Crear usuario
    const user = await User.create(name, email, password, role);

    res.status(201).json({
      message: `Usuario ${role === 'admin' ? 'administrador' : role === 'attendant' ? 'empleado' : ''} creado exitosamente`,
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    });
  } catch (error) {
    console.error('Error al crear usuario:', error);
    res.status(500).json({ error: 'Error al crear usuario' });
  }
});

// PUT /api/admin/users/:id - Actualizar usuario (nombre y rol)
router.put('/users/:id', [
  body('name').optional().trim().notEmpty().withMessage('El nombre no puede estar vacío'),
  body('role').optional().isIn(['user', 'admin', 'attendant']).withMessage('Rol inválido')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { name, role } = req.body;

    // Verificar si el usuario existe
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Actualizar usuario
    await User.update(id, name, role);

    const updatedUser = await User.findById(id);
    res.json({
      message: 'Usuario actualizado exitosamente',
      user: updatedUser
    });
  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    res.status(500).json({ error: 'Error al actualizar usuario' });
  }
});

// GET /api/admin/appointments - Obtener todas las citas
router.get('/appointments', async (req, res) => {
  try {
    const appointments = await Appointment.getAll();
    res.json(appointments);
  } catch (error) {
    console.error('Error al obtener todas las citas:', error);
    res.status(500).json({ error: 'Error al obtener citas' });
  }
});

// PUT /api/admin/appointments/:id/status - Actualizar estado de cita
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

// PUT /api/admin/appointments/:id/notes - Actualizar notas del empleado
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
