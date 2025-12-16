const express = require('express');
const router = express.Router();
const reporteController = require('../Controllers/reporteController');
const authPanel = require('../Middleware/authPanel');

// Todas las rutas requieren autenticación
router.use(authPanel);

// Dashboard completo
router.get('/dashboard', reporteController.getDashboard);

// Endpoints individuales
router.get('/resumen', reporteController.getResumen);
router.get('/ventas-mes', reporteController.getVentasMes);
router.get('/top-productos', reporteController.getTopProductos);

module.exports = router;
