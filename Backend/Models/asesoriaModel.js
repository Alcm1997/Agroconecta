const pool = require('../db');

// Crear nueva consulta de asesoría
async function crearConsulta({ nombre, email, mensaje }) {
    const query = `
    INSERT INTO consulta_asesoria (nombre, email, mensaje)
    VALUES ($1, $2, $3)
    RETURNING id_consulta, nombre, email, mensaje, fecha_consulta, estado
  `;

    const result = await pool.query(query, [nombre, email, mensaje]);
    return result.rows[0];
}

// Obtener todas las consultas (para panel admin)
async function obtenerConsultas(filtros = {}) {
    const { estado, page = 1, limit = 20 } = filtros;
    const offset = (page - 1) * limit;

    let whereClause = '';
    let params = [];
    let paramIndex = 1;

    if (estado) {
        whereClause = `WHERE estado = $${paramIndex}`;
        params.push(estado);
        paramIndex++;
    }

    const countQuery = `SELECT COUNT(*) as total FROM consulta_asesoria ${whereClause}`;
    const countResult = await pool.query(countQuery, params);
    const total = parseInt(countResult.rows[0].total);

    const query = `
    SELECT 
      ca.id_consulta,
      ca.nombre,
      ca.email,
      ca.mensaje,
      ca.fecha_consulta,
      ca.estado,
      ca.fecha_respuesta,
      u.nombres || ' ' || u.apellidos as respondido_por_nombre
    FROM consulta_asesoria ca
    LEFT JOIN usuario u ON ca.respondido_por = u.id_usuario
    ${whereClause}
    ORDER BY ca.fecha_consulta DESC
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
  `;

    params.push(limit, offset);
    const result = await pool.query(query, params);

    return {
        consultas: result.rows,
        total,
        page,
        limit
    };
}

// Obtener una consulta por ID
async function obtenerConsultaPorId(id_consulta) {
    const query = `
    SELECT 
      ca.id_consulta,
      ca.nombre,
      ca.email,
      ca.mensaje,
      ca.fecha_consulta,
      ca.estado,
      ca.fecha_respuesta,
      u.nombres || ' ' || u.apellidos as respondido_por_nombre
    FROM consulta_asesoria ca
    LEFT JOIN usuario u ON ca.respondido_por = u.id_usuario
    WHERE ca.id_consulta = $1
  `;

    const result = await pool.query(query, [id_consulta]);
    return result.rows[0] || null;
}

// Marcar consulta como respondida
async function marcarComoRespondida(id_consulta, id_usuario) {
    const query = `
    UPDATE consulta_asesoria 
    SET estado = 'Respondida', 
        respondido_por = $2, 
        fecha_respuesta = CURRENT_TIMESTAMP
    WHERE id_consulta = $1
    RETURNING *
  `;

    const result = await pool.query(query, [id_consulta, id_usuario]);
    return result.rows[0] || null;
}

// Cambiar estado de consulta
async function cambiarEstado(id_consulta, nuevo_estado) {
    const query = `
    UPDATE consulta_asesoria 
    SET estado = $2
    WHERE id_consulta = $1
    RETURNING *
  `;

    const result = await pool.query(query, [id_consulta, nuevo_estado]);
    return result.rows[0] || null;
}

module.exports = {
    crearConsulta,
    obtenerConsultas,
    obtenerConsultaPorId,
    marcarComoRespondida,
    cambiarEstado
};
