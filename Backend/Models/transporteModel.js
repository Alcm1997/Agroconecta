const pool = require('../db');

// ========== TRANSPORTISTAS ==========

// Obtener todos los transportistas
async function obtenerTodos() {
    const query = `
    SELECT 
      t.id_transportista,
      t.razon_social,
      t.ruc,
      COUNT(v.id_vehiculo) as cantidad_vehiculos
    FROM transportista t
    LEFT JOIN vehiculo v ON t.id_transportista = v.id_transportista
    GROUP BY t.id_transportista
    ORDER BY t.razon_social
  `;
    const result = await pool.query(query);
    return result.rows;
}

// Obtener transportista por ID
async function obtenerPorId(id_transportista) {
    const query = `
    SELECT id_transportista, razon_social, ruc
    FROM transportista
    WHERE id_transportista = $1
  `;
    const result = await pool.query(query, [id_transportista]);
    return result.rows[0] || null;
}

// Crear transportista
async function crear({ razon_social, ruc }) {
    const query = `
    INSERT INTO transportista (razon_social, ruc)
    VALUES ($1, $2)
    RETURNING *
  `;
    const result = await pool.query(query, [razon_social, ruc]);
    return result.rows[0];
}

// Actualizar transportista
async function actualizar(id_transportista, { razon_social, ruc }) {
    const query = `
    UPDATE transportista
    SET razon_social = $2, ruc = $3
    WHERE id_transportista = $1
    RETURNING *
  `;
    const result = await pool.query(query, [id_transportista, razon_social, ruc]);
    return result.rows[0] || null;
}

// Eliminar transportista
async function eliminar(id_transportista) {
    // Primero verificar si tiene vehículos
    const vehiculosQuery = `SELECT COUNT(*) as count FROM vehiculo WHERE id_transportista = $1`;
    const vehiculosResult = await pool.query(vehiculosQuery, [id_transportista]);

    if (parseInt(vehiculosResult.rows[0].count) > 0) {
        throw new Error('No se puede eliminar: tiene vehículos asociados');
    }

    const query = `DELETE FROM transportista WHERE id_transportista = $1 RETURNING *`;
    const result = await pool.query(query, [id_transportista]);
    return result.rows[0] || null;
}

// Verificar si RUC ya existe
async function existeRuc(ruc, excludeId = null) {
    let query = `SELECT id_transportista FROM transportista WHERE ruc = $1`;
    let params = [ruc];

    if (excludeId) {
        query += ` AND id_transportista != $2`;
        params.push(excludeId);
    }

    const result = await pool.query(query, params);
    return result.rowCount > 0;
}

// ========== VEHÍCULOS ==========

// Obtener todos los vehículos
async function obtenerVehiculos(id_transportista = null) {
    let query = `
    SELECT 
      v.id_vehiculo,
      v.id_transportista,
      v.placa,
      t.razon_social as transportista_nombre
    FROM vehiculo v
    JOIN transportista t ON v.id_transportista = t.id_transportista
  `;

    let params = [];
    if (id_transportista) {
        query += ` WHERE v.id_transportista = $1`;
        params.push(id_transportista);
    }

    query += ` ORDER BY t.razon_social, v.placa`;

    const result = await pool.query(query, params);
    return result.rows;
}

// Obtener vehículo por ID
async function obtenerVehiculoPorId(id_vehiculo) {
    const query = `
    SELECT 
      v.id_vehiculo,
      v.id_transportista,
      v.placa,
      t.razon_social as transportista_nombre
    FROM vehiculo v
    JOIN transportista t ON v.id_transportista = t.id_transportista
    WHERE v.id_vehiculo = $1
  `;
    const result = await pool.query(query, [id_vehiculo]);
    return result.rows[0] || null;
}

// Crear vehículo
async function crearVehiculo({ id_transportista, placa }) {
    const query = `
    INSERT INTO vehiculo (id_transportista, placa)
    VALUES ($1, $2)
    RETURNING *
  `;
    const result = await pool.query(query, [id_transportista, placa.toUpperCase()]);
    return result.rows[0];
}

// Actualizar vehículo
async function actualizarVehiculo(id_vehiculo, { id_transportista, placa }) {
    const query = `
    UPDATE vehiculo
    SET id_transportista = $2, placa = $3
    WHERE id_vehiculo = $1
    RETURNING *
  `;
    const result = await pool.query(query, [id_vehiculo, id_transportista, placa.toUpperCase()]);
    return result.rows[0] || null;
}

// Eliminar vehículo
async function eliminarVehiculo(id_vehiculo) {
    // Verificar si tiene guías asociadas
    const guiasQuery = `SELECT COUNT(*) as count FROM guia_remision WHERE id_vehiculo = $1`;
    const guiasResult = await pool.query(guiasQuery, [id_vehiculo]);

    if (parseInt(guiasResult.rows[0].count) > 0) {
        throw new Error('No se puede eliminar: tiene guías de remisión asociadas');
    }

    const query = `DELETE FROM vehiculo WHERE id_vehiculo = $1 RETURNING *`;
    const result = await pool.query(query, [id_vehiculo]);
    return result.rows[0] || null;
}

// Verificar si placa ya existe
async function existePlaca(placa, excludeId = null) {
    let query = `SELECT id_vehiculo FROM vehiculo WHERE UPPER(placa) = UPPER($1)`;
    let params = [placa];

    if (excludeId) {
        query += ` AND id_vehiculo != $2`;
        params.push(excludeId);
    }

    const result = await pool.query(query, params);
    return result.rowCount > 0;
}

module.exports = {
    // Transportistas
    obtenerTodos,
    obtenerPorId,
    crear,
    actualizar,
    eliminar,
    existeRuc,
    // Vehículos
    obtenerVehiculos,
    obtenerVehiculoPorId,
    crearVehiculo,
    actualizarVehiculo,
    eliminarVehiculo,
    existePlaca
};
