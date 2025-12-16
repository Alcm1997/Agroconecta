const express = require('express');
const router = express.Router();
const authPanelController = require('../Controllers/authPanelController');
const authPanel = require('../Middleware/authPanel');

// Ruta para login de usuarios internos
router.post('/login', authPanelController.loginPanel);

// ✅ Ruta para verificar autenticación de admin con información completa
router.get('/verify-admin', authPanel, (req, res) => {
    console.log('🔍 Verificando admin:', req.user); // Debug
    
    res.json({
        id_usuario: req.user.id_usuario,
        username: req.user.username,
        cargo: req.user.cargo,
        nombres: req.user.nombres || 'Admin',
        apellidos: req.user.apellidos || 'Sistema',
        email: req.user.email || 'admin@sistema.com'
    });
});

module.exports = router;