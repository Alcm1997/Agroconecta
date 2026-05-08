const pool = require('../config/database');

// ========== VEHÍCULOS ==========

// Obtener todos los vehículos
async function obtenerTodos(id_transportista = null) {
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
async function obtenerPorId(id_vehiculo) {
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
async function crear({ id_transportista, placa }) {
    const query = `
    INSERT INTO vehiculo (id_transportista, placa)
    VALUES ($1, $2)
    RETURNING *
  `;
    const result = await pool.query(query, [id_transportista, placa.toUpperCase()]);
    return result.rows[0];
}

// Actualizar vehículo
async function actualizar(id_vehiculo, { id_transportista, placa }) {
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
async function eliminar(id_vehiculo) {
    // Verificar si tiene guías asociadas (Regla de integridad)
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
    obtenerTodos,
    obtenerPorId,
    crear,
    actualizar,
    eliminar,
    existePlaca
};
