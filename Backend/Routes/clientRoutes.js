const express = require('express');
const router = express.Router();
const clientController = require('../Controllers/clientController');
const pedidoController = require('../Controllers/pedidoController');
const authMiddleware = require('../Middleware/auth'); // Middleware para verificar JWT

// ========== RUTAS ESPECÍFICAS (deben ir ANTES de /:id) ==========

// Registro y Login
router.post('/register', clientController.registerClient);
router.post('/login', clientController.loginClient);

// Verificaciones
router.post('/check-email', clientController.checkClientByEmail);
router.post('/check-document', clientController.checkClientByDocument);

// Perfil del cliente autenticado
router.get('/me', authMiddleware, clientController.me);
router.get('/profile', authMiddleware, clientController.getProfile);
router.put('/profile', authMiddleware, clientController.updateProfile);
router.delete('/account', authMiddleware, clientController.deleteMyAccount);

// ✅ Rutas de pedidos del cliente (específicas, antes de /:id)
router.get('/pedidos', authMiddleware, pedidoController.listarPorCliente);
router.get('/pedidos/:id_pedido', authMiddleware, pedidoController.obtenerDetalle);
router.put('/pedidos/:id_pedido/cancelar', authMiddleware, pedidoController.cancelar);
router.get('/pedidos/:id_pedido/comprobante', authMiddleware, pedidoController.obtenerComprobante);

// ========== RUTAS GENÉRICAS (deben ir AL FINAL) ==========

// Obtener todos los clientes
router.get('/', clientController.getAllClients);

// Obtener cliente por ID (DEBE IR AL FINAL porque /:id captura cualquier cosa)
router.get('/:id', clientController.getClientById);

// Actualizar cliente por ID
router.put('/:id', clientController.updateClient);

// Eliminar cliente por ID
router.delete('/:id', clientController.deleteClient);

module.exports = router;