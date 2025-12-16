const express = require('express');
const router = express.Router();
const cargoController = require('../Controllers/cargoController');

router.post('/', cargoController.createCargo);
router.get('/', cargoController.getAllCargos);
router.get('/:id', cargoController.getCargoById);
router.put('/:id', cargoController.updateCargo);
router.delete('/:id', cargoController.deleteCargo);

module.exports = router;