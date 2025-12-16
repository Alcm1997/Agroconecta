const express = require('express');
const router = express.Router();
const distritoController = require('../Controllers/distritoController');

router.post('/', distritoController.createDistrito);
router.get('/', distritoController.getAllDistritos);
router.get('/:id', distritoController.getDistritoById);
router.get('/departamento/:id_departamento', distritoController.getDistritosByDepartamento);
router.put('/:id', distritoController.updateDistrito);
router.delete('/:id', distritoController.deleteDistrito);

module.exports = router;