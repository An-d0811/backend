require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

// Importar configuración de base de datos
require('./config/database');

// Rutas
const authRoutes = require('./routes/auth');
const appointmentRoutes = require('./routes/appointments');
const adminRoutes = require('./routes/admin');
const attendantRoutes = require('./routes/attendant');

const app = express();
const PORT = process.env.PORT || 5000;

// CORS - permitir todas las orígenes para acceso remoto
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos (imágenes subidas)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Rutas API
app.use('/api/auth', authRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/attendant', attendantRoutes);

// Ruta de prueba
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'API del Salón de Manicura funcionando' });
});

// Manejo de errores
app.use((err, req, res, next) => {
  console.error('Error:', err);
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'El archivo es demasiado grande. Máximo 5MB' });
    }
    return res.status(400).json({ error: err.message });
  }
  res.status(500).json({ error: 'Error interno del servidor' });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`\n💅 Servidor corriendo en http://localhost:${PORT}`);
  console.log(`📋 Endpoints disponibles:`);
  console.log(`   - POST /api/auth/register`);
  console.log(`   - POST /api/auth/login`);
  console.log(`   - GET  /api/auth/me`);
  console.log(`   - GET  /api/appointments`);
  console.log(`   - POST /api/appointments`);
  console.log(`   - PUT  /api/appointments/:id/cancel`);
  console.log(`   - GET  /api/admin/appointments`);
  console.log(`   - PUT  /api/admin/appointments/:id/status\n`);
});

module.exports = app;
