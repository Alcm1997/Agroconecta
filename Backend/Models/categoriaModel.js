const pool = require('../db');

// Obtener todas las categorías activas
exports.getAllCategorias = async () => {
  const { rows } = await pool.query('SELECT * FROM categoria ORDER BY descripcion');
  return rows;
};

// Obtener categoría por ID
exports.getCategoriaById = async (id) => {
  const { rows } = await pool.query('SELECT * FROM categoria WHERE id_categoria = $1', [id]);
  return rows[0];
};

// Crear categoría
exports.createCategoria = async (descripcion) => {
  const { rows } = await pool.query(
    'INSERT INTO categoria (descripcion) VALUES ($1) RETURNING *',
    [descripcion]
  );
  return rows[0];
};

// Actualizar categoría
exports.updateCategoria = async (id, descripcion) => {
  const { rows } = await pool.query(
    'UPDATE categoria SET descripcion = $1 WHERE id_categoria = $2 RETURNING *',
    [descripcion, id]
  );
  return rows[0];
};

// Eliminar categoría (verificar que no tenga productos asociados)
exports.deleteCategoria = async (id) => {
  // Verificar si tiene productos asociados
  const { rows: productos } = await pool.query(
    'SELECT COUNT(*) as count FROM producto WHERE id_categoria = $1',
    [id]
  );
  
  if (parseInt(productos[0].count) > 0) {
    throw new Error('No se puede eliminar la categoría porque tiene productos asociados');
  }
  
  const { rows } = await pool.query(
    'DELETE FROM categoria WHERE id_categoria = $1 RETURNING *',
    [id]
  );
  return rows[0];
};