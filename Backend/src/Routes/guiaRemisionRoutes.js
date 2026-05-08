const express = require('express');
const router = express.Router();
const guiaController = require('../Controllers/guiaRemisionController');
const authPanel = require('../Middleware/authPanel');

// Todas las rutas requieren autenticación
router.use(authPanel);

// CRUD de guías
router.get('/', guiaController.listarGuias);
router.get('/:id', guiaController.obtenerGuia);
router.post('/', guiaController.crearGuia);
router.put('/:id', guiaController.actualizarGuia);
router.delete('/:id', guiaController.eliminarGuia);

// Rutas adicionales
router.get('/pedido/:id_pedido', guiaController.obtenerGuiaPorPedido);
router.get('/pedido/:id_pedido/datos-creacion', guiaController.obtenerDatosCreacion);

module.exports = router;
