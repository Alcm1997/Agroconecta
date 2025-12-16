const express = require('express');
const router = express.Router();
const clientController = require('../Controllers/clientController');
const authPanel = require('../Middleware/authPanel');

// Listar TODOS (activos e inactivos)
router.get('/', authPanel, clientController.getAllClientsPanel);

// Desactivar (soft delete)
router.delete('/:id', authPanel, clientController.deleteClient);

// Reactivar
router.patch('/:id/activate', authPanel, clientController.reactivateClientByAdmin);

module.exports = router;