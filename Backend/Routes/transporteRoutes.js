const express = require('express');
const router = express.Router();
const transporteController = require('../Controllers/transporteController');
const authPanel = require('../Middleware/authPanel');

// ========== TRANSPORTISTAS ==========
router.get('/transportistas', authPanel, transporteController.listarTransportistas);
router.get('/transportistas/:id', authPanel, transporteController.obtenerTransportista);
router.post('/transportistas', authPanel, transporteController.crearTransportista);
router.put('/transportistas/:id', authPanel, transporteController.actualizarTransportista);
router.delete('/transportistas/:id', authPanel, transporteController.eliminarTransportista);

// ========== VEHÍCULOS ==========
router.get('/vehiculos', authPanel, transporteController.listarVehiculos);
router.get('/vehiculos/:id', authPanel, transporteController.obtenerVehiculo);
router.post('/vehiculos', authPanel, transporteController.crearVehiculo);
router.put('/vehiculos/:id', authPanel, transporteController.actualizarVehiculo);
router.delete('/vehiculos/:id', authPanel, transporteController.eliminarVehiculo);

module.exports = router;
