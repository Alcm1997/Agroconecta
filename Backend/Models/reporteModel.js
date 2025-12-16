const pool = require('../db');

// ========== DASHBOARD DE REPORTES ==========

// Obtener resumen general (KPIs)
async function obtenerResumenGeneral() {
    const query = `
    SELECT 
      (SELECT COUNT(*) FROM pedido WHERE estado != 'Cancelado') as total_pedidos,
      (SELECT COUNT(*) FROM pedido WHERE estado = 'Pendiente') as pedidos_pendientes,
      (SELECT COUNT(*) FROM pedido WHERE estado = 'Entregado') as pedidos_entregados,
      (SELECT COUNT(*) FROM pedido WHERE estado = 'Cancelado') as pedidos_cancelados,
      (SELECT COALESCE(SUM(total), 0) FROM pedido WHERE estado != 'Cancelado') as ingresos_totales,
      (SELECT COUNT(*) FROM cliente WHERE estado = 'Activo') as total_clientes,
      (SELECT COUNT(*) FROM producto WHERE stock > 0) as productos_disponibles,
      (SELECT COUNT(*) FROM guia_remision) as guias_emitidas
  `;
    const result = await pool.query(query);
    return result.rows[0];
}

// Obtener ventas por mes (últimos 6 meses)
async function obtenerVentasPorMes() {
    const query = `
    SELECT 
      TO_CHAR(fecha_pedido, 'YYYY-MM') as mes,
      TO_CHAR(fecha_pedido, 'Mon YYYY') as mes_nombre,
      COUNT(*) as cantidad_pedidos,
      COALESCE(SUM(total), 0) as total_ventas
    FROM pedido
    WHERE estado != 'Cancelado'
      AND fecha_pedido >= CURRENT_DATE - INTERVAL '6 months'
    GROUP BY TO_CHAR(fecha_pedido, 'YYYY-MM'), TO_CHAR(fecha_pedido, 'Mon YYYY')
    ORDER BY mes DESC
    LIMIT 6
  `;
    const result = await pool.query(query);
    return result.rows.reverse(); // Ordenar de más antiguo a más reciente
}

// Obtener top 5 productos más vendidos
async function obtenerTopProductos() {
    const query = `
    SELECT 
      p.id_producto,
      p.nombre,
      c.descripcion as categoria,
      SUM(dp.cantidad) as total_vendido,
      SUM(dp.cantidad * dp.precio_unitario) as ingresos
    FROM detalle_pedido dp
    JOIN producto p ON dp.id_producto = p.id_producto
    JOIN pedido ped ON dp.id_pedido = ped.id_pedido
    LEFT JOIN categoria c ON p.id_categoria = c.id_categoria
    WHERE ped.estado != 'Cancelado'
    GROUP BY p.id_producto, p.nombre, c.descripcion
    ORDER BY total_vendido DESC
    LIMIT 5
  `;
    const result = await pool.query(query);
    return result.rows;
}

// Obtener pedidos por estado (para gráfico de pie)
async function obtenerPedidosPorEstado() {
    const query = `
    SELECT 
      estado,
      COUNT(*) as cantidad,
      COALESCE(SUM(total), 0) as total
    FROM pedido
    GROUP BY estado
    ORDER BY cantidad DESC
  `;
    const result = await pool.query(query);
    return result.rows;
}

// Obtener clientes top (más compras)
async function obtenerTopClientes() {
    const query = `
    SELECT 
      c.id_cliente,
      COALESCE(c.razon_social, CONCAT(c.nombres, ' ', c.apellidos)) as nombre,
      c.tipo_cliente,
      COUNT(p.id_pedido) as total_pedidos,
      COALESCE(SUM(p.total), 0) as total_compras
    FROM cliente c
    JOIN pedido p ON c.id_cliente = p.id_cliente
    WHERE p.estado != 'Cancelado'
    GROUP BY c.id_cliente, c.razon_social, c.nombres, c.apellidos, c.tipo_cliente
    ORDER BY total_compras DESC
    LIMIT 5
  `;
    const result = await pool.query(query);
    return result.rows;
}

// Obtener ventas por categoría
async function obtenerVentasPorCategoria() {
    const query = `
    SELECT 
      c.id_categoria,
      c.descripcion as categoria,
      SUM(dp.cantidad) as total_vendido,
      SUM(dp.cantidad * dp.precio_unitario) as ingresos
    FROM detalle_pedido dp
    JOIN producto p ON dp.id_producto = p.id_producto
    JOIN pedido ped ON dp.id_pedido = ped.id_pedido
    LEFT JOIN categoria c ON p.id_categoria = c.id_categoria
    WHERE ped.estado != 'Cancelado'
    GROUP BY c.id_categoria, c.descripcion
    ORDER BY ingresos DESC
  `;
    const result = await pool.query(query);
    return result.rows;
}

// Obtener todos los datos del dashboard
async function obtenerDashboardCompleto() {
    const [resumen, ventasMes, topProductos, pedidosEstado, topClientes, ventasCategoria] = await Promise.all([
        obtenerResumenGeneral(),
        obtenerVentasPorMes(),
        obtenerTopProductos(),
        obtenerPedidosPorEstado(),
        obtenerTopClientes(),
        obtenerVentasPorCategoria()
    ]);

    return {
        resumen,
        ventasMes,
        topProductos,
        pedidosEstado,
        topClientes,
        ventasCategoria
    };
}

module.exports = {
    obtenerResumenGeneral,
    obtenerVentasPorMes,
    obtenerTopProductos,
    obtenerPedidosPorEstado,
    obtenerTopClientes,
    obtenerVentasPorCategoria,
    obtenerDashboardCompleto
};
