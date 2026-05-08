const express = require('express');
const router = express.Router();
const distritoController = require('../Controllers/distritoController');

const { validarDistrito } = require('../Validators/distritoValidator');

router.post('/', validarDistrito, distritoController.createDistrito);
router.get('/', distritoController.getAllDistritos);
router.get('/:id', distritoController.getDistritoById);
router.get('/departamento/:id_departamento', distritoController.getDistritosByDepartamento);
router.put('/:id', validarDistrito, distritoController.updateDistrito);
router.delete('/:id', distritoController.deleteDistrito);

module.exports = router;
