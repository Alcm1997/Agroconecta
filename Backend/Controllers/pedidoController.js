const pedidoModel = require('../Models/pedidoModel');

// Crear pedido desde la tienda
exports.crear = async (req, res) => {
  try {
    // Obtener ID del cliente desde el middleware de autenticación
    const id_cliente = req.cliente?.id_cliente || req.user?.id_cliente || req.body.id_cliente;
    if (!id_cliente) {
      return res.status(401).json({ 
        success: false,
        message: 'No autenticado. Inicia sesión para continuar.' 
      });
    }

    const { items, id_tipo_pago } = req.body;

    // Validaciones básicas
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Items del pedido son requeridos'
      });
    }

    if (!id_tipo_pago) {
      return res.status(400).json({
        success: false,
        message: 'Tipo de pago es requerido'
      });
    }

    // Crear pedido con comprobante
    const resultado = await pedidoModel.crearPedidoConComprobante({ 
      id_cliente, 
      id_tipo_pago, 
      items 
    });

    // Respuesta exitosa con datos completos para el comprobante
    res.status(201).json({
      success: true,
      message: 'Pedido creado exitosamente',
      id_pedido: resultado.id_pedido,
      tipo_comprobante: resultado.tipo_comprobante,
      numero_comprobante: resultado.numero_comprobante,
      total: resultado.total,
      subtotal: resultado.subtotal,
      igv: resultado.igv,
      fecha_pedido: resultado.fecha_pedido || new Date().toISOString(),
      estado: resultado.estado || 'Pendiente',
      items_detalle: resultado.items_detalle || []
    });

  } catch (error) {
    console.error('Error al crear pedido:', error);
    res.status(500).json({ 
      success: false,
      message: error.message || 'Error interno del servidor al crear el pedido' 
    });
  }
};

// Listar pedidos del cliente autenticado
exports.listarPorCliente = async (req, res) => {
  try {
    const id_cliente = req.cliente?.id_cliente || req.user?.id_cliente;
    if (!id_cliente) {
      return res.status(401).json({ 
        success: false,
        message: 'No autenticado' 
      });
    }

    const pedidos = await pedidoModel.obtenerPedidosPorCliente(id_cliente);
    
    res.json({
      success: true,
      pedidos: pedidos
    });

  } catch (error) {
    console.error('Error al listar pedidos:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al obtener los pedidos' 
    });
  }
};

// Obtener detalle de un pedido específico
exports.obtenerDetalle = async (req, res) => {
  try {
    const id_cliente = req.cliente?.id_cliente || req.user?.id_cliente;
    const { id_pedido } = req.params;

    if (!id_cliente) {
      return res.status(401).json({ 
        success: false,
        message: 'No autenticado' 
      });
    }

    if (!id_pedido) {
      return res.status(400).json({
        success: false,
        message: 'ID del pedido es requerido'
      });
    }

    const detalle = await pedidoModel.obtenerDetallePedido(id_pedido, id_cliente);
    
    if (!detalle) {
      return res.status(404).json({
        success: false,
        message: 'Pedido no encontrado'
      });
    }

    res.json({
      success: true,
      pedido: detalle
    });

  } catch (error) {
    console.error('Error al obtener detalle del pedido:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al obtener el detalle del pedido' 
    });
  }
};

// Actualizar estado del pedido (solo para administradores)
exports.actualizarEstado = async (req, res) => {
  try {
    const { id_pedido } = req.params;
    const { estado } = req.body;

    if (!id_pedido || !estado) {
      return res.status(400).json({
        success: false,
        message: 'ID del pedido y estado son requeridos'
      });
    }

    const resultado = await pedidoModel.actualizarEstadoPedido(id_pedido, estado);
    
    if (!resultado) {
      return res.status(404).json({
        success: false,
        message: 'Pedido no encontrado'
      });
    }

    res.json({
      success: true,
      message: 'Estado del pedido actualizado correctamente'
    });

  } catch (error) {
    console.error('Error al actualizar estado del pedido:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al actualizar el estado del pedido' 
    });
  }
};

// Listar todos los pedidos (solo para administradores)
exports.listarTodos = async (req, res) => {
  try {
    const { page = 1, limit = 10, estado, fecha_inicio, fecha_fin } = req.query;
    
    const filtros = {
      page: parseInt(page),
      limit: parseInt(limit),
      estado,
      fecha_inicio,
      fecha_fin
    };

    const resultado = await pedidoModel.obtenerTodosPedidos(filtros);
    
    res.json({
      success: true,
      pedidos: resultado.pedidos,
      total: resultado.total,
      page: filtros.page,
      totalPages: Math.ceil(resultado.total / filtros.limit)
    });

  } catch (error) {
    console.error('Error al listar todos los pedidos:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al obtener los pedidos' 
    });
  }
};

// Cancelar pedido
exports.cancelar = async (req, res) => {
  try {
    const id_cliente = req.cliente?.id_cliente || req.user?.id_cliente;
    const { id_pedido } = req.params;

    if (!id_cliente) {
      return res.status(401).json({ 
        success: false,
        message: 'No autenticado' 
      });
    }

    if (!id_pedido) {
      return res.status(400).json({
        success: false,
        message: 'ID del pedido es requerido'
      });
    }

    const resultado = await pedidoModel.cancelarPedido(id_pedido, id_cliente);
    
    if (!resultado) {
      return res.status(404).json({
        success: false,
        message: 'Pedido no encontrado o no se puede cancelar'
      });
    }

    res.json({
      success: true,
      message: 'Pedido cancelado correctamente'
    });

  } catch (error) {
    console.error('Error al cancelar pedido:', error);
    res.status(500).json({ 
      success: false,
      message: error.message || 'Error al cancelar el pedido' 
    });
  }
};

// Obtener comprobante de un pedido
exports.obtenerComprobante = async (req, res) => {
  try {
    const id_cliente = req.cliente?.id_cliente || req.user?.id_cliente;
    const { id_pedido } = req.params;

    if (!id_cliente) {
      return res.status(401).json({ 
        success: false,
        message: 'No autenticado' 
      });
    }

    if (!id_pedido) {
      return res.status(400).json({
        success: false,
        message: 'ID del pedido es requerido'
      });
    }

    const comprobante = await pedidoModel.obtenerComprobantePedido(id_pedido, id_cliente);
    
    if (!comprobante) {
      return res.status(404).json({
        success: false,
        message: 'Comprobante no encontrado'
      });
    }

    res.json({
      success: true,
      comprobante: comprobante
    });

  } catch (error) {
    console.error('Error al obtener comprobante:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al obtener el comprobante' 
    });
  }
};

// Estadísticas de pedidos (para dashboard de administrador)
exports.obtenerEstadisticas = async (req, res) => {
  try {
    const { periodo = 'mes' } = req.query; // dia, semana, mes, año
    
    const estadisticas = await pedidoModel.obtenerEstadisticasPedidos(periodo);
    
    res.json({
      success: true,
      estadisticas: estadisticas
    });

  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al obtener las estadísticas' 
    });
  }
};