const express = require('express');
const router = express.Router();
const pedidoCtrl = require('../Controllers/pedidoController');
const auth = require('../Middleware/auth'); // debe validar token cliente y setear req.cliente

// Obtener tipos de pago disponibles
router.get('/api/tienda/tipos-pago', async (req, res) => {
  try {
    const pool = require('../db');
    const result = await pool.query('SELECT id_tipo_pago, descripcion FROM tipo_pago ORDER BY id_tipo_pago');
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener tipos de pago:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});
// Crear pedido + comprobante
router.post('/api/tienda/pedidos', auth, pedidoCtrl.crear);

module.exports = router;