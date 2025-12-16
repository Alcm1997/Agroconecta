const express = require('express');
const router = express.Router();
const authPanel = require('../Middleware/authPanel');
const pedidoModel = require('../Models/pedidoModel');

// Todas las rutas requieren autenticación de administrador
router.use(authPanel);

// Listar todos los pedidos con filtros
router.get('/', async (req, res) => {
    try {
        const { page, limit, estado, fecha_inicio, fecha_fin } = req.query;

        const filtros = {
            page: parseInt(page) || 1,
            limit: parseInt(limit) || 20,
            estado,
            fecha_inicio,
            fecha_fin
        };

        const resultado = await pedidoModel.obtenerTodosPedidosAdmin(filtros);

        res.json({
            success: true,
            ...resultado,
            totalPages: Math.ceil(resultado.total / resultado.limit)
        });

    } catch (error) {
        console.error('Error al listar pedidos:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener los pedidos',
            error: error.message
        });
    }
});

// Obtener detalle de un pedido específico
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        if (!id || isNaN(id)) {
            return res.status(400).json({
                success: false,
                message: 'ID de pedido inválido'
            });
        }

        const pedido = await pedidoModel.obtenerDetallePedidoAdmin(parseInt(id));

        if (!pedido) {
            return res.status(404).json({
                success: false,
                message: 'Pedido no encontrado'
            });
        }

        res.json({
            success: true,
            pedido
        });

    } catch (error) {
        console.error('Error al obtener detalle del pedido:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener el detalle del pedido',
            error: error.message
        });
    }
});

// Actualizar estado del pedido
router.put('/:id/estado', async (req, res) => {
    try {
        const { id } = req.params;
        const { estado } = req.body;

        if (!id || isNaN(id)) {
            return res.status(400).json({
                success: false,
                message: 'ID de pedido inválido'
            });
        }

        if (!estado) {
            return res.status(400).json({
                success: false,
                message: 'Estado es requerido'
            });
        }

        const pedidoActualizado = await pedidoModel.actualizarEstadoPedidoAdmin(
            parseInt(id),
            estado
        );

        res.json({
            success: true,
            message: 'Estado del pedido actualizado correctamente',
            pedido: pedidoActualizado
        });

    } catch (error) {
        console.error('Error al actualizar estado del pedido:', error);
        res.status(400).json({
            success: false,
            message: error.message || 'Error al actualizar el estado del pedido'
        });
    }
});

// Obtener estadísticas generales
router.get('/estadisticas/generales', async (req, res) => {
    try {
        const estadisticas = await pedidoModel.obtenerEstadisticasGenerales();

        res.json({
            success: true,
            estadisticas
        });

    } catch (error) {
        console.error('Error al obtener estadísticas:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener las estadísticas',
            error: error.message
        });
    }
});

module.exports = router;
