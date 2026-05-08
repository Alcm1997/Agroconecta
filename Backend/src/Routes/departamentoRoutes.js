const express = require('express');
const router = express.Router();
const departamentoController = require('../Controllers/departamentoController');

const { validarDepartamento } = require('../Validators/departamentoValidator');

router.post('/', validarDepartamento, departamentoController.createDepartamento);
router.get('/', departamentoController.getAllDepartamentos);
router.get('/:id', departamentoController.getDepartamentoById);
router.put('/:id', validarDepartamento, departamentoController.updateDepartamento);
router.delete('/:id', departamentoController.deleteDepartamento);

module.exports = router;
