const pool = require('../db');

// Obtener todas las unidades de medida
exports.getAllUnidades = async () => {
  const { rows } = await pool.query('SELECT * FROM unidad_medida ORDER BY descripcion');
  return rows;
};

// Obtener unidad de medida por ID
exports.getUnidadById = async (id) => {
  const { rows } = await pool.query('SELECT * FROM unidad_medida WHERE id_unidad = $1', [id]);
  return rows[0];
};

// Crear unidad de medida
exports.createUnidad = async (descripcion) => {
  const { rows } = await pool.query(
    'INSERT INTO unidad_medida (descripcion) VALUES ($1) RETURNING *',
    [descripcion]
  );
  return rows[0];
};

// Actualizar unidad de medida
exports.updateUnidad = async (id, descripcion) => {
  const { rows } = await pool.query(
    'UPDATE unidad_medida SET descripcion = $1 WHERE id_unidad = $2 RETURNING *',
    [descripcion, id]
  );
  return rows[0];
};

// Eliminar unidad de medida (verificar que no tenga productos asociados)
exports.deleteUnidad = async (id) => {
  // Verificar si tiene productos asociados
  const { rows: productos } = await pool.query(
    'SELECT COUNT(*) as count FROM producto WHERE id_unidad = $1',
    [id]
  );
  
  if (parseInt(productos[0].count) > 0) {
    throw new Error('No se puede eliminar la unidad de medida porque tiene productos asociados');
  }
  
  const { rows } = await pool.query(
    'DELETE FROM unidad_medida WHERE id_unidad = $1 RETURNING *',
    [id]
  );
  return rows[0];
};