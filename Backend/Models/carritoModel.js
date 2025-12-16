const pool = require('../db');

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

// Agregar item al carrito
async function agregarItem(id_cliente, id_producto, cantidad, opciones = []) {
    // Verificar si el producto ya existe en el carrito con las mismas opciones
    const existeQuery = `
    SELECT id_carrito, cantidad 
    FROM carrito 
    WHERE id_cliente = $1 AND id_producto = $2 AND opciones::text = $3::text
  `;

    const existe = await pool.query(existeQuery, [
        id_cliente,
        id_producto,
        JSON.stringify(opciones)
    ]);

    if (existe.rowCount > 0) {
        // Actualizar cantidad si ya existe
        const nuevaCantidad = existe.rows[0].cantidad + cantidad;
        const updateQuery = `
      UPDATE carrito 
      SET cantidad = $1, fecha_agregado = CURRENT_TIMESTAMP
      WHERE id_carrito = $2
      RETURNING *
    `;
        const result = await pool.query(updateQuery, [nuevaCantidad, existe.rows[0].id_carrito]);
        return result.rows[0];
    } else {
        // Insertar nuevo item
        const insertQuery = `
      INSERT INTO carrito (id_cliente, id_producto, cantidad, opciones)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
        const result = await pool.query(insertQuery, [
            id_cliente,
            id_producto,
            cantidad,
            JSON.stringify(opciones)
        ]);
        return result.rows[0];
    }
}

// Actualizar cantidad de un item
async function actualizarCantidad(id_carrito, id_cliente, cantidad) {
    if (cantidad <= 0) {
        // Si la cantidad es 0 o negativa, eliminar el item
        return await eliminarItem(id_carrito, id_cliente);
    }

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
    return { success: true, message: 'Carrito vaciado' };
}

// Sincronizar carrito desde localStorage (al login)
async function sincronizarCarrito(id_cliente, itemsLocal = []) {
    if (!Array.isArray(itemsLocal) || itemsLocal.length === 0) {
        return await obtenerCarrito(id_cliente);
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Agregar cada item del localStorage al carrito de BD
        for (const item of itemsLocal) {
            const { id_producto, cantidad, opciones = [] } = item;

            // Verificar si ya existe
            const existeQuery = `
        SELECT id_carrito, cantidad 
        FROM carrito 
        WHERE id_cliente = $1 AND id_producto = $2 AND opciones::text = $3::text
      `;

            const existe = await client.query(existeQuery, [
                id_cliente,
                id_producto,
                JSON.stringify(opciones)
            ]);

            if (existe.rowCount > 0) {
                // Sumar cantidades
                const nuevaCantidad = existe.rows[0].cantidad + cantidad;
                await client.query(
                    'UPDATE carrito SET cantidad = $1 WHERE id_carrito = $2',
                    [nuevaCantidad, existe.rows[0].id_carrito]
                );
            } else {
                // Insertar nuevo
                await client.query(
                    `INSERT INTO carrito (id_cliente, id_producto, cantidad, opciones)
           VALUES ($1, $2, $3, $4)`,
                    [id_cliente, id_producto, cantidad, JSON.stringify(opciones)]
                );
            }
        }

        await client.query('COMMIT');

        // Retornar carrito completo actualizado
        return await obtenerCarrito(id_cliente);
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
}

module.exports = {
    obtenerCarrito,
    agregarItem,
    actualizarCantidad,
    eliminarItem,
    vaciarCarrito,
    sincronizarCarrito
};
