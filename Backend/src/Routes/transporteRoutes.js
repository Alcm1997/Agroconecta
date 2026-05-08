const express = require('express');
const router = express.Router();
const transportistaController = require('../Controllers/transportistaController');
const vehiculoController = require('../Controllers/vehiculoController');
const authPanel = require('../Middleware/authPanel');
const { validarTransportista } = require('../Validators/transportistaValidator');
const { validarVehiculo } = require('../Validators/vehiculoValidator');

// ========== TRANSPORTISTAS ==========
router.get('/transportistas', authPanel, transportistaController.listarTransportistas);
router.get('/transportistas/:id', authPanel, transportistaController.obtenerTransportista);
router.post('/transportistas', authPanel, validarTransportista, transportistaController.crearTransportista);
router.put('/transportistas/:id', authPanel, validarTransportista, transportistaController.actualizarTransportista);
router.delete('/transportistas/:id', authPanel, transportistaController.eliminarTransportista);

// ========== VEHÍCULOS ==========
router.get('/vehiculos', authPanel, vehiculoController.listarVehiculos);
router.get('/vehiculos/:id', authPanel, vehiculoController.obtenerVehiculo);
router.post('/vehiculos', authPanel, validarVehiculo, vehiculoController.crearVehiculo);
router.put('/vehiculos/:id', authPanel, validarVehiculo, vehiculoController.actualizarVehiculo);
router.delete('/vehiculos/:id', authPanel, vehiculoController.eliminarVehiculo);

module.exports = router;
