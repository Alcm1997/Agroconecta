const express = require('express');
const router = express.Router();
const userController = require('../Controllers/userController');
const authPanel = require('../Middleware/authPanel');
const cargoController = require('../Controllers/cargoController');


const { validarUsuario } = require('../Validators/userValidator');

// CRUD usuarios internos (requiere autenticación)
router.get('/cargos/list', authPanel, cargoController.getAllCargos);
router.post('/', authPanel, validarUsuario, userController.createUser);
router.get('/', authPanel, userController.getAllUsers);
router.get('/:id', authPanel, userController.getUserById);
router.put('/:id', authPanel, validarUsuario, userController.updateUser);
router.delete('/:id', authPanel, userController.deactivateUser);
router.patch('/:id/activate', authPanel, userController.activateUser);

module.exports = router;
