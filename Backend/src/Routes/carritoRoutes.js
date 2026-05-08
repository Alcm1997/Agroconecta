const express = require('express');
const router = express.Router();
const auth = require('../Middleware/auth');
const carritoController = require('../Controllers/carritoController');

// Todas las rutas requieren autenticación de cliente
router.use(auth);

const { validarItemCarrito, validarActualizacionCantidad } = require('../Validators/carritoValidator');

// Obtener carrito del cliente
router.get('/', carritoController.obtener);

// Agregar item al carrito
router.post('/', validarItemCarrito, carritoController.agregar);

// Sincronizar carrito desde localStorage
router.post('/sincronizar', carritoController.sincronizar);

// Actualizar cantidad de un item
router.put('/:id', validarActualizacionCantidad, carritoController.actualizar);

// Eliminar un item del carrito
router.delete('/:id', carritoController.eliminar);

// Vaciar todo el carrito
router.delete('/', carritoController.vaciar);

module.exports = router;
