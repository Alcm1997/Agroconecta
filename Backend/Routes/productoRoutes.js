const express = require('express');

const router = express.Router();
const productoController = require('../Controllers/productoController');
const authPanel = require('../Middleware/authPanel');

router.use(authPanel); // protege todo lo de abajo

router.get('/datos-auxiliares', authPanel, productoController.getDatosAuxiliares);
// Opciones adicionales (MOVIDO ARRIBA)
router.get('/opciones', authPanel, productoController.getOpcionesDisponibles);

router.get('/', productoController.getAllProductos);
router.get('/:id', productoController.getProductoById);
router.post('/', productoController.createProducto);
router.put('/:id', productoController.updateProducto);
router.delete('/:id', productoController.deleteProducto);
router.patch('/:id/stock', productoController.updateStock);
router.get('/:id/descuentos', authPanel, productoController.getDescuentosVolumen);
router.post('/:id/descuentos', authPanel, productoController.setDescuentosVolumen);
router.get('/:id/opciones', authPanel, productoController.getOpcionesProducto);
router.post('/:id/opciones', authPanel, productoController.setOpcionesProducto);
// Componentes de pack
router.get('/:id/componentes', authPanel, productoController.getComponentesPack);
router.post('/:id/componentes', authPanel, productoController.setComponentesPack);


module.exports = router;