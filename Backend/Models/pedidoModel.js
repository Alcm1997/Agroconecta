const pool = require('../db');

// Obtiene precio unitario aplicando descuento_volumen para una cantidad
async function getPrecioConDescuento(client, idProducto, cantidad) {
  const baseRes = await client.query(
    'SELECT precio_unitario FROM producto WHERE id_producto = $1',
    [idProducto]
  );
  if (baseRes.rowCount === 0) throw new Error(`Producto ${idProducto} no existe`);
  let precio = Number(baseRes.rows[0].precio_unitario);

  const discRes = await client.query(
    `SELECT precio_descuento
     FROM descuento_volumen
     WHERE id_producto = $1
       AND cantidad_minima <= $2
       AND (cantidad_maxima IS NULL OR cantidad_maxima >= $2)
     ORDER BY cantidad_minima DESC
     LIMIT 1`,
    [idProducto, cantidad]
  );
  if (discRes.rowCount > 0) precio = Number(discRes.rows[0].precio_descuento);
  return precio;
}

// Suma adicionales por unidad (opciones válidas para el producto, ej. NDS)
async function getAdicionalOpciones(client, idProducto, opciones = []) {
  if (!opciones || opciones.length === 0) return 0;
  const res = await client.query(
    `SELECT COALESCE(SUM(oa.precio_adicional),0) AS extra
     FROM opcion_adicional oa
     JOIN producto_opcion po ON po.id_opcion = oa.id_opcion
     WHERE po.id_producto = $1 AND oa.id_opcion = ANY($2::int[])`,
    [idProducto, opciones]
  );
  return Number(res.rows[0].extra || 0);
}

// Crea pedido + detalle y comprobante + detalle (todo en una transacción)
async function crearPedidoConComprobante({ id_cliente, id_tipo_pago = null, items = [] }) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error('El pedido requiere items');
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Datos del cliente para decidir boleta/factura
    const cliRes = await client.query(
      'SELECT tipo_cliente FROM cliente WHERE id_cliente = $1',
      [id_cliente]
    );
    if (cliRes.rowCount === 0) throw new Error('Cliente no existe');
    const tipoCliente = cliRes.rows[0].tipo_cliente; // 'Natural' | 'Jurídica'
    const tipoComprobante = tipoCliente === 'Jurídica' ? 'Factura' : 'Boleta';

    // Preparar líneas con bloqueo de stock por producto
    const lineas = [];
    let total = 0;

    for (const it of items) {
      const idProd = Number(it.id_producto);
      const cant = Math.max(1, Number(it.cantidad));
      const opciones = Array.isArray(it.opciones) ? it.opciones.map(Number) : [];

      // Bloquear fila del producto y validar stock
      const pRes = await client.query(
        'SELECT id_producto, stock FROM producto WHERE id_producto = $1 FOR UPDATE',
        [idProd]
      );
      if (pRes.rowCount === 0) throw new Error(`Producto ${idProd} no existe`);
      const stock = Number(pRes.rows[0].stock || 0);
      if (stock < cant) throw new Error(`Stock insuficiente para producto ${idProd}`);

      // Precio con descuento + adicionales por unidad
      const precioBase = await getPrecioConDescuento(client, idProd, cant);
      const adicional = await getAdicionalOpciones(client, idProd, opciones);
      const precioUnit = Number((precioBase + adicional).toFixed(2));

      const lineTotal = Number((precioUnit * cant).toFixed(2));
      total = Number((total + lineTotal).toFixed(2));

      lineas.push({
        id_producto: idProd,
        cantidad: cant,
        precio_unitario: precioUnit,
        opciones
      });

      // Descontar stock
      await client.query(
        'UPDATE producto SET stock = stock - $1 WHERE id_producto = $2',
        [cant, idProd]
      );
    }

    // Insertar pedido
    const pedRes = await client.query(
      `INSERT INTO pedido (id_cliente, id_usuario, fecha_pedido, estado, id_tipo_pago, total)
       VALUES ($1, NULL, CURRENT_DATE, 'Pendiente', $2, $3)
       RETURNING id_pedido`,
      [id_cliente, id_tipo_pago, total]
    );
    const id_pedido = pedRes.rows[0].id_pedido;

    // Insertar detalle_pedido
    for (const ln of lineas) {
      await client.query(
        `INSERT INTO detalle_pedido (id_pedido, id_producto, cantidad, precio_unitario, opciones)
         VALUES ($1, $2, $3, $4, $5)`,
        [id_pedido, ln.id_producto, ln.cantidad, ln.precio_unitario, JSON.stringify(ln.opciones || [])]
      );
    }

    // Numeración y comprobante
    const numero =
      tipoComprobante === 'Factura'
        ? (await client.query('SELECT next_factura() AS n')).rows[0].n
        : (await client.query('SELECT next_boleta() AS n')).rows[0].n;

    // Cálculo IGV 18% (ajusta si aplica otro esquema)
    const igvRate = 0.18;
    const subtotal = Number((total / (1 + igvRate)).toFixed(2));
    const igv = Number((total - subtotal).toFixed(2));

    const compRes = await client.query(
      `INSERT INTO comprobante
         (id_pedido, tipo_comprobante, numero_comprobante, fecha_emision, subtotal, igv, total_pago)
       VALUES ($1, $2, $3, CURRENT_DATE, $4, $5, $6)
       RETURNING id_comprobante`,
      [id_pedido, tipoComprobante, numero, subtotal, igv, total]
    );
    const id_comprobante = compRes.rows[0].id_comprobante;

    // Detalle de comprobante (múltiples líneas por producto soportadas por PK nueva)
    for (const ln of lineas) {
      await client.query(
        `INSERT INTO detalle_comprobante (id_comprobante, id_producto, cantidad, precio_unitario)
         VALUES ($1, $2, $3, $4)`,
        [id_comprobante, ln.id_producto, ln.cantidad, ln.precio_unitario]
      );
    }

    await client.query('COMMIT');
    return { id_pedido, id_comprobante, numero_comprobante: numero, total, tipo_comprobante: tipoComprobante };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { crearPedidoConComprobante };

// ========== MÉTODOS PARA ADMINISTRADORES ==========

// Obtener todos los pedidos con filtros y paginación
async function obtenerTodosPedidosAdmin(filtros = {}) {
  const { page = 1, limit = 20, estado, fecha_inicio, fecha_fin } = filtros;
  const offset = (page - 1) * limit;

  let whereConditions = [];
  let params = [];
  let paramIndex = 1;

  if (estado) {
    whereConditions.push(`p.estado = $${paramIndex}`);
    params.push(estado);
    paramIndex++;
  }

  if (fecha_inicio) {
    whereConditions.push(`p.fecha_pedido >= $${paramIndex}`);
    params.push(fecha_inicio);
    paramIndex++;
  }

  if (fecha_fin) {
    whereConditions.push(`p.fecha_pedido <= $${paramIndex}`);
    params.push(fecha_fin);
    paramIndex++;
  }

  const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

  // Query para contar total
  const countQuery = `
    SELECT COUNT(*) as total
    FROM pedido p
    ${whereClause}
  `;

  const countResult = await pool.query(countQuery, params);
  const total = parseInt(countResult.rows[0].total);

  // Query para obtener pedidos
  const query = `
    SELECT 
      p.id_pedido,
      p.fecha_pedido,
      p.fecha_entrega,
      p.estado,
      p.total,
      c.id_cliente,
      COALESCE(c.razon_social, CONCAT(c.nombres, ' ', c.apellidos)) as nombre_cliente,
      c.email,
      c.tipo_cliente,
      tp.descripcion as tipo_pago,
      comp.numero_comprobante,
      comp.tipo_comprobante
    FROM pedido p
    JOIN cliente c ON p.id_cliente = c.id_cliente
    LEFT JOIN tipo_pago tp ON p.id_tipo_pago = tp.id_tipo_pago
    LEFT JOIN comprobante comp ON comp.id_pedido = p.id_pedido
    ${whereClause}
    ORDER BY p.fecha_pedido DESC, p.id_pedido DESC
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
  `;

  params.push(limit, offset);
  const result = await pool.query(query, params);

  return {
    pedidos: result.rows,
    total,
    page,
    limit
  };
}

// Obtener detalle completo de un pedido (para administrador)
async function obtenerDetallePedidoAdmin(id_pedido) {
  // Información del pedido
  const pedidoQuery = `
    SELECT 
      p.id_pedido,
      p.fecha_pedido,
      p.fecha_entrega,
      p.estado,
      p.total,
      p.id_tipo_pago,
      tp.descripcion as tipo_pago,
      c.id_cliente,
      c.tipo_cliente,
      c.numero_documento,
      c.email,
      c.telefono,
      c.direccion,
      COALESCE(c.razon_social, CONCAT(c.nombres, ' ', c.apellidos)) as nombre_cliente,
      d.nombre_distrito,
      dep.nombre_departamento
    FROM pedido p
    JOIN cliente c ON p.id_cliente = c.id_cliente
    LEFT JOIN tipo_pago tp ON p.id_tipo_pago = tp.id_tipo_pago
    LEFT JOIN distrito d ON c.id_distrito = d.id_distrito
    LEFT JOIN departamento dep ON d.id_departamento = dep.id_departamento
    WHERE p.id_pedido = $1
  `;

  const pedidoResult = await pool.query(pedidoQuery, [id_pedido]);

  if (pedidoResult.rowCount === 0) {
    return null;
  }

  const pedido = pedidoResult.rows[0];

  // Detalle de productos
  const detalleQuery = `
    SELECT 
      dp.id_detalle,
      dp.cantidad,
      dp.precio_unitario,
      dp.opciones,
      pr.id_producto,
      pr.nombre as nombre_producto,
      pr.imagen_url,
      um.descripcion as unidad_medida,
      cat.descripcion as categoria
    FROM detalle_pedido dp
    JOIN producto pr ON dp.id_producto = pr.id_producto
    LEFT JOIN unidad_medida um ON pr.id_unidad = um.id_unidad
    LEFT JOIN categoria cat ON pr.id_categoria = cat.id_categoria
    WHERE dp.id_pedido = $1
    ORDER BY dp.id_detalle
  `;

  const detalleResult = await pool.query(detalleQuery, [id_pedido]);

  // Comprobante
  const comprobanteQuery = `
    SELECT 
      id_comprobante,
      tipo_comprobante,
      numero_comprobante,
      fecha_emision,
      subtotal,
      igv,
      total_pago,
      estado
    FROM comprobante
    WHERE id_pedido = $1
  `;

  const comprobanteResult = await pool.query(comprobanteQuery, [id_pedido]);

  return {
    ...pedido,
    items: detalleResult.rows,
    comprobante: comprobanteResult.rows[0] || null
  };
}

// Actualizar estado del pedido
async function actualizarEstadoPedidoAdmin(id_pedido, nuevo_estado) {
  const estadosValidos = ['Pendiente', 'Entregado', 'Cancelado'];

  if (!estadosValidos.includes(nuevo_estado)) {
    throw new Error(`Estado inválido. Debe ser: ${estadosValidos.join(', ')}`);
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Obtener estado actual
    const pedidoActual = await client.query(
      'SELECT estado, id_pedido FROM pedido WHERE id_pedido = $1',
      [id_pedido]
    );

    if (pedidoActual.rowCount === 0) {
      throw new Error('Pedido no encontrado');
    }

    const estadoAnterior = pedidoActual.rows[0].estado;

    // Si se cancela un pedido, restaurar stock
    if (nuevo_estado === 'Cancelado' && estadoAnterior !== 'Cancelado') {
      const detalleQuery = `
        SELECT id_producto, cantidad 
        FROM detalle_pedido 
        WHERE id_pedido = $1
      `;
      const detalle = await client.query(detalleQuery, [id_pedido]);

      for (const item of detalle.rows) {
        await client.query(
          'UPDATE producto SET stock = stock + $1 WHERE id_producto = $2',
          [item.cantidad, item.id_producto]
        );
      }
    }

    // Actualizar estado primero
    await client.query(
      'UPDATE pedido SET estado = $1 WHERE id_pedido = $2',
      [nuevo_estado, id_pedido]
    );

    // Si es Entregado, actualizar fecha_entrega
    if (nuevo_estado === 'Entregado') {
      await client.query(
        'UPDATE pedido SET fecha_entrega = CURRENT_DATE WHERE id_pedido = $1',
        [id_pedido]
      );
    }

    // Obtener el pedido actualizado
    const result = await client.query(
      'SELECT * FROM pedido WHERE id_pedido = $1',
      [id_pedido]
    );

    await client.query('COMMIT');
    return result.rows[0];
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

// Obtener estadísticas para el dashboard
async function obtenerEstadisticasGenerales() {
  const queries = {
    // Total de ventas del mes actual
    ventasMes: `
      SELECT COALESCE(SUM(total), 0) as total
      FROM pedido
      WHERE EXTRACT(MONTH FROM fecha_pedido) = EXTRACT(MONTH FROM CURRENT_DATE)
        AND EXTRACT(YEAR FROM fecha_pedido) = EXTRACT(YEAR FROM CURRENT_DATE)
        AND estado != 'Cancelado'
    `,

    // Pedidos pendientes
    pedidosPendientes: `
      SELECT COUNT(*) as total
      FROM pedido
      WHERE estado = 'Pendiente'
    `,

    // Productos con stock bajo (menos de 10 unidades)
    stockBajo: `
      SELECT COUNT(*) as total
      FROM producto
      WHERE stock < 10
    `,

    // Nuevos clientes este mes
    clientesNuevos: `
      SELECT COUNT(*) as total
      FROM cliente
      WHERE EXTRACT(MONTH FROM CURRENT_TIMESTAMP) = EXTRACT(MONTH FROM CURRENT_TIMESTAMP)
    `,

    // Total de pedidos hoy
    pedidosHoy: `
      SELECT COUNT(*) as total
      FROM pedido
      WHERE fecha_pedido = CURRENT_DATE
    `,

    // Top 5 productos más vendidos (del mes)
    topProductos: `
      SELECT 
        pr.nombre,
        SUM(dp.cantidad) as total_vendido,
        pr.stock
      FROM detalle_pedido dp
      JOIN pedido p ON dp.id_pedido = p.id_pedido
      JOIN producto pr ON dp.id_producto = pr.id_producto
      WHERE EXTRACT(MONTH FROM p.fecha_pedido) = EXTRACT(MONTH FROM CURRENT_DATE)
        AND EXTRACT(YEAR FROM p.fecha_pedido) = EXTRACT(YEAR FROM CURRENT_DATE)
        AND p.estado != 'Cancelado'
      GROUP BY pr.id_producto, pr.nombre, pr.stock
      ORDER BY total_vendido DESC
      LIMIT 5
    `,

    // Productos con stock crítico (detalle)
    productosStockCritico: `
      SELECT 
        id_producto,
        nombre,
        stock,
        precio_unitario
      FROM producto
      WHERE stock < 10
      ORDER BY stock ASC
      LIMIT 10
    `
  };

  const results = {};

  for (const [key, query] of Object.entries(queries)) {
    const result = await pool.query(query);
    results[key] = result.rows;
  }

  return {
    ventas_mes: parseFloat(results.ventasMes[0]?.total || 0),
    pedidos_pendientes: parseInt(results.pedidosPendientes[0]?.total || 0),
    stock_bajo: parseInt(results.stockBajo[0]?.total || 0),
    clientes_nuevos: parseInt(results.clientesNuevos[0]?.total || 0),
    pedidos_hoy: parseInt(results.pedidosHoy[0]?.total || 0),
    top_productos: results.topProductos,
    productos_stock_critico: results.productosStockCritico
  };
}

// ========== MÉTODOS PARA CLIENTES ==========

// Obtener pedidos de un cliente específico
async function obtenerPedidosPorCliente(id_cliente) {
  const query = `
    SELECT 
      p.id_pedido,
      p.fecha_pedido,
      p.fecha_entrega,
      p.estado,
      p.total,
      tp.descripcion as tipo_pago,
      comp.id_comprobante,
      comp.numero_comprobante,
      comp.tipo_comprobante
    FROM pedido p
    LEFT JOIN tipo_pago tp ON p.id_tipo_pago = tp.id_tipo_pago
    LEFT JOIN comprobante comp ON comp.id_pedido = p.id_pedido
    WHERE p.id_cliente = $1
    ORDER BY p.fecha_pedido DESC, p.id_pedido DESC
  `;

  const result = await pool.query(query, [id_cliente]);
  return result.rows;
}

// Obtener detalle de un pedido para cliente (verificando que pertenece al cliente)
async function obtenerDetallePedido(id_pedido, id_cliente) {
  // Verificar que el pedido pertenece al cliente
  const pedidoQuery = `
    SELECT 
      p.id_pedido,
      p.fecha_pedido,
      p.fecha_entrega,
      p.estado,
      p.total,
      tp.descripcion as tipo_pago,
      comp.numero_comprobante,
      comp.tipo_comprobante
    FROM pedido p
    LEFT JOIN tipo_pago tp ON p.id_tipo_pago = tp.id_tipo_pago
    LEFT JOIN comprobante comp ON comp.id_pedido = p.id_pedido
    WHERE p.id_pedido = $1 AND p.id_cliente = $2
  `;

  const pedidoResult = await pool.query(pedidoQuery, [id_pedido, id_cliente]);

  if (pedidoResult.rowCount === 0) {
    return null;
  }

  const pedido = pedidoResult.rows[0];

  // Obtener items del pedido
  const itemsQuery = `
    SELECT 
      dp.id_detalle,
      dp.cantidad,
      dp.precio_unitario,
      (dp.cantidad * dp.precio_unitario) as subtotal,
      pr.nombre as nombre_producto,
      pr.imagen_url,
      um.descripcion as unidad_medida
    FROM detalle_pedido dp
    JOIN producto pr ON dp.id_producto = pr.id_producto
    LEFT JOIN unidad_medida um ON pr.id_unidad = um.id_unidad
    WHERE dp.id_pedido = $1
    ORDER BY dp.id_detalle
  `;

  const itemsResult = await pool.query(itemsQuery, [id_pedido]);

  return {
    ...pedido,
    items: itemsResult.rows
  };
}

// Cancelar un pedido (solo si está pendiente y pertenece al cliente)
async function cancelarPedido(id_pedido, id_cliente) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Verificar que el pedido existe, pertenece al cliente y está pendiente
    const checkQuery = `
      SELECT id_pedido, estado 
      FROM pedido 
      WHERE id_pedido = $1 AND id_cliente = $2
    `;
    const checkResult = await client.query(checkQuery, [id_pedido, id_cliente]);

    if (checkResult.rowCount === 0) {
      return null;
    }

    if (checkResult.rows[0].estado !== 'Pendiente') {
      throw new Error('Solo se pueden cancelar pedidos en estado Pendiente');
    }

    // Restaurar stock
    const detalleQuery = `
      SELECT id_producto, cantidad 
      FROM detalle_pedido 
      WHERE id_pedido = $1
    `;
    const detalle = await client.query(detalleQuery, [id_pedido]);

    for (const item of detalle.rows) {
      await client.query(
        'UPDATE producto SET stock = stock + $1 WHERE id_producto = $2',
        [item.cantidad, item.id_producto]
      );
    }

    // Actualizar estado del pedido
    const updateQuery = `
      UPDATE pedido 
      SET estado = 'Cancelado'
      WHERE id_pedido = $1
      RETURNING *
    `;
    const result = await client.query(updateQuery, [id_pedido]);

    await client.query('COMMIT');
    return result.rows[0];
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

// Obtener comprobante de un pedido para cliente
async function obtenerComprobantePedido(id_pedido, id_cliente) {
  const query = `
    SELECT 
      comp.id_comprobante,
      comp.tipo_comprobante,
      comp.numero_comprobante,
      comp.fecha_emision,
      comp.subtotal,
      comp.igv,
      comp.total_pago,
      comp.estado
    FROM comprobante comp
    JOIN pedido p ON comp.id_pedido = p.id_pedido
    WHERE comp.id_pedido = $1 AND p.id_cliente = $2
  `;

  const result = await pool.query(query, [id_pedido, id_cliente]);
  return result.rows[0] || null;
}

module.exports = {
  crearPedidoConComprobante,
  // Funciones para administradores
  obtenerTodosPedidosAdmin,
  obtenerDetallePedidoAdmin,
  actualizarEstadoPedidoAdmin,
  obtenerEstadisticasGenerales,
  // Funciones para clientes
  obtenerPedidosPorCliente,
  obtenerDetallePedido,
  cancelarPedido,
  obtenerComprobantePedido
};