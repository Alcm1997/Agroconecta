const express = require('express');
const router = express.Router();
const recoveryController = require('../Controllers/recoveryController');

// Enviar código de recuperación
router.post('/send-code', recoveryController.sendRecoveryCode);

// Verificar código y cambiar contraseña
router.post('/reset-password', recoveryController.resetPassword);

module.exports = router;
