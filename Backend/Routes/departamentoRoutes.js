const express = require('express');
const router = express.Router();
const departamentoController = require('../Controllers/departamentoController');

router.post('/', departamentoController.createDepartamento);
router.get('/', departamentoController.getAllDepartamentos);
router.get('/:id', departamentoController.getDepartamentoById);
router.put('/:id', departamentoController.updateDepartamento);
router.delete('/:id', departamentoController.deleteDepartamento);

module.exports = router;