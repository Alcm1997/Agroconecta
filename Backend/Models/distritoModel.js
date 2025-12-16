const pool = require('../db');

// Crear distrito
exports.createDistrito = async (nombre_distrito, id_departamento) => {
  const result = await pool.query(
    'INSERT INTO distrito (nombre_distrito, id_departamento) VALUES ($1, $2) RETURNING *',
    [nombre_distrito, id_departamento]
  );
  return result.rows[0];
};

// Obtener todos los distritos
exports.getAllDistritos = async () => {
  const result = await pool.query('SELECT * FROM distrito');
  return result.rows;
};

// Obtener distrito por ID
exports.getDistritoById = async (id) => {
  const result = await pool.query('SELECT * FROM distrito WHERE id_distrito = $1', [id]);
  return result.rows[0];
};

// Obtener distritos por departamento
exports.getDistritosByDepartamento = async (id_departamento) => {
  const result = await pool.query('SELECT * FROM distrito WHERE id_departamento = $1', [id_departamento]);
  return result.rows;
};

// Actualizar distrito
exports.updateDistrito = async (id, nombre_distrito, id_departamento) => {
  const result = await pool.query(
    'UPDATE distrito SET nombre_distrito = $1, id_departamento = $2 WHERE id_distrito = $3 RETURNING *',
    [nombre_distrito, id_departamento, id]
  );
  return result.rows[0];
};

// Eliminar distrito
exports.deleteDistrito = async (id) => {
  const result = await pool.query('DELETE FROM distrito WHERE id_distrito = $1 RETURNING *', [id]);
  return result.rowCount > 0;
};