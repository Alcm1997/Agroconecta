const express = require('express');
const router = express.Router();
const categoriaController = require('../Controllers/categoriaController');
const authPanel = require('../Middleware/authPanel');

const { validarCategoria } = require('../Validators/categoriaValidator');

// Rutas para el panel (requieren autenticación)
router.get('/', authPanel, categoriaController.getAllCategorias);
router.get('/:id', authPanel, categoriaController.getCategoriaById);
router.post('/', authPanel, validarCategoria, categoriaController.createCategoria);
router.put('/:id', authPanel, validarCategoria, categoriaController.updateCategoria);
router.delete('/:id', authPanel, categoriaController.deleteCategoria);

module.exports = router;
