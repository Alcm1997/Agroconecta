const pool = require('../config/database');

// Obtener carrito del cliente
async function obtenerCarrito(id_cliente) {
    const query = `
    SELECT 
      c.id_carrito,
      c.id_producto,
      c.cantidad,
      c.opciones,
      c.fecha_agregado,
      p.nombre,
      p.precio_unitario,
      p.stock,
      p.imagen_url,
      um.descripcion as unidad_medida
    FROM carrito c
    JOIN producto p ON c.id_producto = p.id_producto
    LEFT JOIN unidad_medida um ON p.id_unidad = um.id_unidad
    WHERE c.id_cliente = $1
    ORDER BY c.fecha_agregado DESC
  `;

    const result = await pool.query(query, [id_cliente]);
    return result.rows;
}

// Obtener un item específico del carrito (para el servicio)
async function obtenerItemEspecifico(id_cliente, id_producto, opciones = []) {
    const query = `
        SELECT * FROM carrito 
        WHERE id_cliente = $1 AND id_producto = $2 AND opciones::text = $3::text
    `;
    const result = await pool.query(query, [id_cliente, id_producto, JSON.stringify(opciones)]);
    return result.rows[0];
}

// Agregar item al carrito (inserción pura)
async function agregarItem(id_cliente, id_producto, cantidad, opciones = []) {
    const query = `
        INSERT INTO carrito (id_cliente, id_producto, cantidad, opciones)
        VALUES ($1, $2, $3, $4)
        RETURNING *
    `;
    const result = await pool.query(query, [id_cliente, id_producto, cantidad, JSON.stringify(opciones)]);
    return result.rows[0];
}

// Actualizar cantidad de un item
async function actualizarCantidad(id_carrito, id_cliente, cantidad) {
    const query = `
        UPDATE carrito 
        SET cantidad = $1, fecha_agregado = CURRENT_TIMESTAMP
        WHERE id_carrito = $2 AND id_cliente = $3
        RETURNING *
    `;
    const result = await pool.query(query, [cantidad, id_carrito, id_cliente]);
    return result.rows[0];
}

// Eliminar un item del carrito
async function eliminarItem(id_carrito, id_cliente) {
    const query = `
        DELETE FROM carrito 
        WHERE id_carrito = $1 AND id_cliente = $2
        RETURNING *
    `;
    const result = await pool.query(query, [id_carrito, id_cliente]);
    return result.rows[0];
}

// Vaciar todo el carrito del cliente
async function vaciarCarrito(id_cliente) {
    const query = `
        DELETE FROM carrito 
        WHERE id_cliente = $1
    `;
    await pool.query(query, [id_cliente]);
    return true;
}

module.exports = {
    obtenerCarrito,
    obtenerItemEspecifico,
    agregarItem,
    actualizarCantidad,
    eliminarItem,
    vaciarCarrito
};
