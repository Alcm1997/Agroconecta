const express = require('express');
const router = express.Router();
const asesoriaController = require('../Controllers/asesoriaController');
const authPanel = require('../Middleware/authPanel'); // Para rutas de admin

// ========== RUTAS PÚBLICAS ==========
// Crear nueva consulta de asesoría (desde el formulario de contacto)
router.post('/', asesoriaController.crearConsulta);

// ========== RUTAS DE ADMINISTRADOR ==========
// Listar todas las consultas
router.get('/', authPanel, asesoriaController.listarConsultas);

// Obtener detalle de una consulta
router.get('/:id', authPanel, asesoriaController.obtenerConsulta);

// Marcar como respondida
router.put('/:id/responder', authPanel, asesoriaController.marcarRespondida);

// Cambiar estado
router.put('/:id/estado', authPanel, asesoriaController.cambiarEstado);

module.exports = router;
