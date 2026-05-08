const pool = require('../config/database');

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
    // Primero verificar si tiene vehículos asociados (Esta lógica se mantiene aquí porque es una regla de integridad del transportista)
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

// Verificar si Razón Social ya existe
async function existeRazonSocial(razon_social, excludeId = null) {
    let query = `SELECT id_transportista FROM transportista WHERE UPPER(razon_social) = UPPER($1)`;
    let params = [razon_social];

    if (excludeId) {
        query += ` AND id_transportista != $2`;
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
    existeRuc,
    existeRazonSocial
};
