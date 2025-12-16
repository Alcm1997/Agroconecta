const pool = require('../db');

// Obtener todos los productos con categoría y unidad
exports.getAllProductos = async () => {
    const { rows } = await pool.query(`
        SELECT 
            p.id_producto,
            p.nombre,
            p.descripcion,
            p.precio_unitario,
            p.stock,
            p.imagen_url,
            c.descripcion AS categoria,
            u.descripcion AS unidad_medida
        FROM producto p
        LEFT JOIN categoria c ON p.id_categoria = c.id_categoria
        LEFT JOIN unidad_medida u ON p.id_unidad = u.id_unidad
        ORDER BY p.id_producto
    `);
    return rows;
};

// Obtener producto por ID con todos sus detalles
exports.getProductoById = async (id) => {
    // Producto base
    const { rows } = await pool.query(`
        SELECT 
            p.*,
            c.descripcion AS categoria,
            u.descripcion AS unidad_medida
        FROM producto p
        LEFT JOIN categoria c ON p.id_categoria = c.id_categoria
        LEFT JOIN unidad_medida u ON p.id_unidad = u.id_unidad
        WHERE p.id_producto = $1
    `, [id]);
    if (rows.length === 0) return null;
    const producto = rows[0];

    // Descuentos por volumen
    const { rows: volumenes } = await pool.query(`
        SELECT 
            id_descuento,
            cantidad_minima,
            cantidad_maxima,
            precio_descuento
        FROM descuento_volumen
        WHERE id_producto = $1
        ORDER BY cantidad_minima ASC
    `, [id]);
    producto.volumenes = volumenes;

    // Opciones adicionales
    const { rows: opciones } = await pool.query(`
        SELECT 
            oa.id_opcion,
            oa.nombre,
            oa.descripcion,
            oa.precio_adicional
        FROM producto_opcion po
        JOIN opcion_adicional oa ON po.id_opcion = oa.id_opcion
        WHERE po.id_producto = $1
    `, [id]);
    producto.opciones = opciones;

    // Componentes del pack (si es pack)
    const { rows: componentes } = await pool.query(`
        SELECT 
            pc.id_componente,
            pc.cantidad,
            p.id_producto,
            p.nombre,
            p.precio_unitario
        FROM pack_componente pc
        JOIN producto p ON pc.id_producto = p.id_producto
        WHERE pc.id_pack = $1
    `, [id]);
    producto.componentes = componentes;

    return producto;
};

exports.createProducto = async (productoData) => {
    const {
        nombre,
        descripcion,
        precio_unitario,
        stock,
        id_unidad,
        id_categoria,
        imagen_url,
        es_pack  // NUEVO
    } = productoData;

    const { rows } = await pool.query(`
        INSERT INTO producto 
        (nombre, descripcion, precio_unitario, stock, id_unidad, id_categoria, imagen_url, es_pack)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
    `, [nombre, descripcion, precio_unitario, stock, id_unidad, id_categoria, imagen_url, es_pack || false]);

    return rows[0];
};

// Actualizar producto base (ACTUALIZADO para incluir es_pack)
exports.updateProducto = async (id, productoData) => {
    const {
        nombre,
        descripcion,
        precio_unitario,
        stock,
        id_unidad,
        id_categoria,
        imagen_url,
        es_pack  // NUEVO
    } = productoData;

    const { rows } = await pool.query(`
        UPDATE producto SET
            nombre = $1,
            descripcion = $2,
            precio_unitario = $3,
            stock = $4,
            id_unidad = $5,
            id_categoria = $6,
            imagen_url = $7,
            es_pack = $8
        WHERE id_producto = $9
        RETURNING *
    `, [nombre, descripcion, precio_unitario, stock, id_unidad, id_categoria, imagen_url, es_pack || false, id]);

    return rows[0];
};

// Eliminar producto
exports.deleteProducto = async (id) => {
    await pool.query('DELETE FROM producto WHERE id_producto = $1', [id]);
    return true;
};

// Obtener descuentos por volumen de un producto
exports.getDescuentosPorProducto = async (id_producto) => {
    const { rows } = await pool.query(`
        SELECT 
            id_descuento,
            cantidad_minima,
            cantidad_maxima,
            precio_descuento
        FROM descuento_volumen
        WHERE id_producto = $1
        ORDER BY cantidad_minima ASC
    `, [id_producto]);
    return rows;
};

// Obtener todas las categorías
exports.getCategorias = async () => {
    const { rows } = await pool.query('SELECT * FROM categoria ORDER BY descripcion');
    return rows;
};

// Obtener todas las unidades de medida
exports.getUnidadesMedida = async () => {
    const { rows } = await pool.query('SELECT * FROM unidad_medida ORDER BY descripcion');
    return rows;
};

// Obtener todas las opciones adicionales
exports.getOpcionesAdicionales = async () => {
    const { rows } = await pool.query(`
        SELECT id_opcion, nombre, descripcion, precio_adicional
        FROM opcion_adicional
        ORDER BY nombre
    `);
    return rows;
};

// Obtener productos que NO son pack (para armar packs)
exports.getProductosNopack = async () => {
    const { rows } = await pool.query(`
        SELECT p.id_producto, p.nombre, p.precio_unitario
        FROM producto p
        WHERE NOT EXISTS (
            SELECT 1 FROM pack_componente pc WHERE pc.id_pack = p.id_producto
        )
        ORDER BY p.nombre
    `);
    return rows;
};

// Obtener descuentos por producto
exports.getDescuentosByProducto = async (id_producto) => {
    const { rows } = await pool.query(
        `SELECT id_descuento, id_producto, cantidad_minima, cantidad_maxima, precio_descuento
         FROM descuento_volumen
         WHERE id_producto = $1
         ORDER BY cantidad_minima ASC`,
        [id_producto]
    );
    return rows;
};

// Reemplazar (borrar e insertar) descuentos por volumen
exports.replaceDescuentosVolumen = async (id_producto, descuentos) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        await client.query('DELETE FROM descuento_volumen WHERE id_producto = $1', [id_producto]);

        const inserted = [];
        for (const d of descuentos) {
            const { cantidad_minima, cantidad_maxima = null, precio_descuento } = d;
            const { rows } = await client.query(
                `INSERT INTO descuento_volumen (id_producto, cantidad_minima, cantidad_maxima, precio_descuento)
                 VALUES ($1, $2, $3, $4)
                 RETURNING id_descuento, id_producto, cantidad_minima, cantidad_maxima, precio_descuento`,
                [id_producto, cantidad_minima, cantidad_maxima, precio_descuento]
            );
            inserted.push(rows[0]);
        }

        await client.query('COMMIT');
        return inserted;
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
};

// Opciones: disponibles en el sistema
exports.getOpcionesDisponibles = async () => {
    const { rows } = await pool.query(`
        SELECT id_opcion, descripcion
        FROM opcion_adicional
        ORDER BY descripcion
    `);
    return rows;
};

// Opciones asignadas a un producto (retorna array de ids)
exports.getOpcionesByProducto = async (id_producto) => {
    const { rows } = await pool.query(
        `SELECT id_opcion
         FROM producto_opcion
         WHERE id_producto = $1
         ORDER BY id_opcion`,
        [id_producto]
    );
    return rows.map(r => r.id_opcion);
};

// Reemplazar opciones de un producto (transacción)
exports.replaceOpcionesProducto = async (id_producto, ids_opcion = []) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        await client.query('DELETE FROM producto_opcion WHERE id_producto = $1', [id_producto]);

        const inserted = [];
        for (const id_opcion of ids_opcion) {
            const { rows } = await client.query(
                `INSERT INTO producto_opcion (id_producto, id_opcion)
                 VALUES ($1, $2)
                 RETURNING id_producto, id_opcion`,
                [id_producto, id_opcion]
            );
            inserted.push(rows[0]);
        }

        await client.query('COMMIT');
        return inserted;
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
};

// Componentes del pack
exports.getComponentesPack = async (id_pack) => {
    const { rows } = await pool.query(
        `SELECT pc.id_pack, pc.id_producto, pc.cantidad, p.nombre
         FROM pack_componente pc
         JOIN producto p ON p.id_producto = pc.id_producto
         WHERE pc.id_pack = $1
         ORDER BY pc.id_producto`,
        [id_pack]
    );
    return rows;
};

// Reemplazar componentes del pack
exports.replaceComponentesPack = async (id_pack, componentes = []) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Limpia componentes actuales
        await client.query('DELETE FROM pack_componente WHERE id_pack = $1', [id_pack]);

        const inserted = [];
        for (const c of componentes) {
            const { id_producto, cantidad } = c;
            const { rows } = await client.query(
                `INSERT INTO pack_componente (id_pack, id_producto, cantidad)
                 VALUES ($1, $2, $3)
                 RETURNING id_pack, id_producto, cantidad`,
                [id_pack, id_producto, cantidad]
            );
            inserted.push(rows[0]);
        }

        await client.query('COMMIT');
        return inserted;
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
};

async function getProductosTienda() {
  const q = `
    SELECT
      p.id_producto,
      p.nombre,
      p.descripcion,
      p.precio_unitario,
      p.stock,
      COALESCE(p.imagen_url, '') AS imagen_url,
      COALESCE(p.es_pack, false) AS es_pack,
      c.descripcion AS categoria,
      u.descripcion AS unidad,
      -- Descuentos por volumen
      COALESCE((
        SELECT json_agg(json_build_object(
                 'cantidad_minima', dv.cantidad_minima,
                 'cantidad_maxima', dv.cantidad_maxima,
                 'precio_descuento', dv.precio_descuento
               ) ORDER BY dv.cantidad_minima)
        FROM descuento_volumen dv
        WHERE dv.id_producto = p.id_producto
      ), '[]') AS descuentos,
      -- Opciones adicionales (NDS, etc.)
      COALESCE((
        SELECT json_agg(json_build_object(
                 'id_opcion', oa.id_opcion,
                 'nombre', oa.nombre,
                 'descripcion', oa.descripcion,
                 'precio_adicional', oa.precio_adicional
               ) ORDER BY oa.id_opcion)
        FROM producto_opcion po
        JOIN opcion_adicional oa ON oa.id_opcion = po.id_opcion
        WHERE po.id_producto = p.id_producto
      ), '[]') AS opciones
    FROM producto p
    LEFT JOIN categoria c ON c.id_categoria = p.id_categoria
    LEFT JOIN unidad_medida u ON u.id_unidad = p.id_unidad
    ORDER BY p.nombre ASC
  `;
  const { rows } = await pool.query(q);
  return rows;
}

module.exports.getProductosTienda = getProductosTienda;