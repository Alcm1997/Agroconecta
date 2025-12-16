const express = require('express');
const router = express.Router();
const categoriaController = require('../Controllers/categoriaController');
const authPanel = require('../Middleware/authPanel');

// Rutas para el panel (requieren autenticación)
router.get('/', authPanel, categoriaController.getAllCategorias);
router.get('/:id', authPanel, categoriaController.getCategoriaById);
router.post('/', authPanel, categoriaController.createCategoria);
router.put('/:id', authPanel, categoriaController.updateCategoria);
router.delete('/:id', authPanel, categoriaController.deleteCategoria);

module.exports = router;