const express = require('express');
const router = express.Router();
const unidadMedidaController = require('../Controllers/unidadMedidaController');
const authPanel = require('../Middleware/authPanel');

const { validarUnidad } = require('../Validators/unidadMedidaValidator');

// Rutas para el panel (requieren autenticación)
router.get('/', authPanel, unidadMedidaController.getAllUnidades);
router.get('/:id', authPanel, unidadMedidaController.getUnidadById);
router.post('/', authPanel, validarUnidad, unidadMedidaController.createUnidad);
router.put('/:id', authPanel, validarUnidad, unidadMedidaController.updateUnidad);
router.delete('/:id', authPanel, unidadMedidaController.deleteUnidad);

module.exports = router;
