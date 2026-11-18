const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// ✅ HEALTH CHECK (Estado del servidor y base de datos)
router.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    return res.status(200).json({
      status: 'ok',
      database: 'connected',
      uptime: Math.round(process.uptime()),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return res.status(503).json({
      status: 'error',
      database: 'disconnected',
      timestamp: new Date().toISOString()
    });
  }
});

// ✅ IMPORTACIÓN DE TODAS LAS RUTAS
const clientRoutes = require('./clientRoutes');
const recoveryRoutes = require('./recoveryRoutes');
const cargoRoutes = require('./cargoRoutes');
const departamentoRoutes = require('./departamentoRoutes');
const distritoRoutes = require('./distritoRoutes');
const authPanelRoutes = require('./authPanelRoutes');
const userRoutes = require('./userRoutes');
const clientPanelRoutes = require('./clientPanelRoutes');
const categoriaRoutes = require('./categoriaRoutes');
const unidadMedidaRoutes = require('./unidadMedidaRoutes');
const productoRoutes = require('./productoRoutes');
const productoTiendaRoutes = require('./productoTiendaRoutes');
const pedidoTiendaRoutes = require('./pedidoTiendaRoutes');
const pedidoAdminRoutes = require('./pedidoAdminRoutes');
const carritoRoutes = require('./carritoRoutes');
const asesoriaRoutes = require('./asesoriaRoutes');
const transporteRoutes = require('./transporteRoutes');
const guiaRemisionRoutes = require('./guiaRemisionRoutes');
const reporteRoutes = require('./reporteRoutes');
const uploadRoutes = require('./uploadRoutes');

// ✅ MONTAJE DE RUTAS (Prefijo /api ya definido en app.js)
// Tienda y Carrito (Rutas específicas primero)
router.use('/tienda/productos', productoTiendaRoutes);
router.use('/client/carrito', carritoRoutes);

// Gestión de Clientes y Autenticación
router.use('/client', clientRoutes);
router.use('/recovery', recoveryRoutes);
router.use('/cargo', cargoRoutes);
router.use('/departamentos', departamentoRoutes);
router.use('/distritos', distritoRoutes);

// Panel Administrativo
router.use('/panel/auth', authPanelRoutes);
router.use('/panel/users', userRoutes);
router.use('/panel/clients', clientPanelRoutes);
router.use('/panel/categorias', categoriaRoutes);
router.use('/panel/unidades-medida', unidadMedidaRoutes);
router.use('/panel/productos', productoRoutes);
router.use('/panel/pedidos', pedidoAdminRoutes);
router.use('/panel/asesorias', asesoriaRoutes);
router.use('/panel/transporte', transporteRoutes);
router.use('/panel/guias', guiaRemisionRoutes);
router.use('/panel/reportes', reporteRoutes);
router.use('/panel/upload', uploadRoutes);

// Otros servicios
router.use('/contacto/asesoria', asesoriaRoutes);

// Rutas de pedido (algunas no tienen prefijo interno adicional)
router.use(pedidoTiendaRoutes);

module.exports = router;
