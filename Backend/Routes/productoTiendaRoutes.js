const express = require('express');
const router = express.Router();
const productoController = require('../Controllers/productoController');
const auth = require('../Middleware/auth'); // si la tienda requiere login de cliente

// Públicas (ajusta según tu necesidad)
// Listado de productos para la tienda
router.get('/', productoController.listarTienda);

// Precio según cantidad (debe ir antes de '/:id')
router.get('/:id/precio', productoController.getPrecioSegunCantidad);

// Detalle de producto (opcional)
router.get('/:id', productoController.getProductoById);

module.exports = router;