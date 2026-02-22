const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'nail-salon-secret-key-2024';

const authMiddleware = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ error: 'Acceso denegado. Token no proporcionado.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token inválido o expirado.' });
  }
};

const adminMiddleware = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Acceso denegado. Se requiere rol de administrador.' });
  }
  next();
};

const attendantMiddleware = (req, res, next) => {
  if (req.user.role !== 'attendant' && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Acceso denegado. Se requiere rol de attendant.' });
  }
  next();
};

module.exports = { authMiddleware, adminMiddleware, attendantMiddleware, JWT_SECRET };
