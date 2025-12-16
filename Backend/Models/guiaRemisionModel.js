const pool = require('../db');

// ========== GUÍAS DE REMISIÓN ==========

// Obtener todas las guías
async function obtenerTodas() {
    const query = `
    SELECT 
      g.id_guia,
      g.id_pedido,
      g.fecha_envio,
      g.punto_partida,
      g.punto_llegada,
      t.id_transportista,
      t.razon_social as transportista_nombre,
      t.ruc as transportista_ruc,
      v.id_vehiculo,
      v.placa,
      p.estado as estado_pedido,
      p.total as total_pedido,
      COALESCE(c.razon_social, CONCAT(c.nombres, ' ', c.apellidos)) as cliente_nombre,
      dep.nombre_departamento,
      dis.nombre_distrito
    FROM guia_remision g
    JOIN pedido p ON g.id_pedido = p.id_pedido
    JOIN cliente c ON p.id_cliente = c.id_cliente
    JOIN transportista t ON g.id_transportista = t.id_transportista
    JOIN vehiculo v ON g.id_vehiculo = v.id_vehiculo
    LEFT JOIN departamento dep ON g.id_departamento = dep.id_departamento
    LEFT JOIN distrito dis ON g.id_distrito = dis.id_distrito
    ORDER BY g.fecha_envio DESC, g.id_guia DESC
  `;
    const result = await pool.query(query);
    return result.rows;
}

// Obtener guía por ID
async function obtenerPorId(id_guia) {
    const query = `
    SELECT 
      g.*,
      t.razon_social as transportista_nombre,
      t.ruc as transportista_ruc,
      v.placa,
      p.estado as estado_pedido,
      p.fecha_pedido,
      p.total as total_pedido,
      COALESCE(c.razon_social, CONCAT(c.nombres, ' ', c.apellidos)) as cliente_nombre,
      c.direccion as cliente_direccion,
      c.email as cliente_email,
      dep.nombre_departamento,
      dis.nombre_distrito
    FROM guia_remision g
    JOIN pedido p ON g.id_pedido = p.id_pedido
    JOIN cliente c ON p.id_cliente = c.id_cliente
    JOIN transportista t ON g.id_transportista = t.id_transportista
    JOIN vehiculo v ON g.id_vehiculo = v.id_vehiculo
    LEFT JOIN departamento dep ON g.id_departamento = dep.id_departamento
    LEFT JOIN distrito dis ON g.id_distrito = dis.id_distrito
    WHERE g.id_guia = $1
  `;
    const result = await pool.query(query, [id_guia]);
    return result.rows[0] || null;
}

// Obtener guía por pedido
async function obtenerPorPedido(id_pedido) {
    const query = `
    SELECT 
      g.*,
      t.razon_social as transportista_nombre,
      t.ruc as transportista_ruc,
      v.placa
    FROM guia_remision g
    JOIN transportista t ON g.id_transportista = t.id_transportista
    JOIN vehiculo v ON g.id_vehiculo = v.id_vehiculo
    WHERE g.id_pedido = $1
  `;
    const result = await pool.query(query, [id_pedido]);
    return result.rows[0] || null;
}

// Verificar si un pedido ya tiene guía
async function existeGuiaPorPedido(id_pedido) {
    const query = `SELECT id_guia FROM guia_remision WHERE id_pedido = $1`;
    const result = await pool.query(query, [id_pedido]);
    return result.rowCount > 0;
}

// Crear guía de remisión
async function crear({ id_pedido, id_transportista, id_vehiculo, punto_partida, punto_llegada, id_distrito, id_departamento }) {
    const query = `
    INSERT INTO guia_remision (
      id_pedido, fecha_envio, id_transportista, id_vehiculo, 
      punto_partida, punto_llegada, id_distrito, id_departamento
    )
    VALUES ($1, CURRENT_DATE, $2, $3, $4, $5, $6, $7)
    RETURNING *
  `;
    const result = await pool.query(query, [
        id_pedido, id_transportista, id_vehiculo,
        punto_partida, punto_llegada, id_distrito || null, id_departamento || null
    ]);
    return result.rows[0];
}

// Actualizar guía de remisión
async function actualizar(id_guia, { id_transportista, id_vehiculo, punto_partida, punto_llegada, id_distrito, id_departamento }) {
    const query = `
    UPDATE guia_remision
    SET id_transportista = $2, id_vehiculo = $3, punto_partida = $4, 
        punto_llegada = $5, id_distrito = $6, id_departamento = $7
    WHERE id_guia = $1
    RETURNING *
  `;
    const result = await pool.query(query, [
        id_guia, id_transportista, id_vehiculo,
        punto_partida, punto_llegada, id_distrito || null, id_departamento || null
    ]);
    return result.rows[0] || null;
}

// Eliminar guía de remisión
async function eliminar(id_guia) {
    const query = `DELETE FROM guia_remision WHERE id_guia = $1 RETURNING *`;
    const result = await pool.query(query, [id_guia]);
    return result.rows[0] || null;
}

// Obtener datos de un pedido para generar guía
async function obtenerDatosPedidoParaGuia(id_pedido) {
    const query = `
    SELECT 
      p.id_pedido,
      p.fecha_pedido,
      p.total,
      p.estado,
      COALESCE(c.razon_social, CONCAT(c.nombres, ' ', c.apellidos)) as cliente_nombre,
      c.direccion as cliente_direccion,
      c.email as cliente_email,
      c.telefono as cliente_telefono,
      dis.nombre_distrito,
      dep.nombre_departamento,
      c.id_distrito,
      dis.id_departamento
    FROM pedido p
    JOIN cliente c ON p.id_cliente = c.id_cliente
    LEFT JOIN distrito dis ON c.id_distrito = dis.id_distrito
    LEFT JOIN departamento dep ON dis.id_departamento = dep.id_departamento
    WHERE p.id_pedido = $1
  `;
    const result = await pool.query(query, [id_pedido]);
    return result.rows[0] || null;
}

module.exports = {
    obtenerTodas,
    obtenerPorId,
    obtenerPorPedido,
    existeGuiaPorPedido,
    crear,
    actualizar,
    eliminar,
    obtenerDatosPedidoParaGuia
};
