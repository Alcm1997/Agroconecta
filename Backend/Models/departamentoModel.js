const pool = require('../db');

// Crear departamento
exports.createDepartamento = async (nombre_departamento) => {
  const result = await pool.query(
    'INSERT INTO departamento (nombre_departamento) VALUES ($1) RETURNING *',
    [nombre_departamento]
  );
  return result.rows[0];
};

// Obtener todos los departamentos
exports.getAllDepartamentos = async () => {
  const result = await pool.query('SELECT * FROM departamento');
  return result.rows;
};

// Obtener departamento por ID
exports.getDepartamentoById = async (id) => {
  const result = await pool.query('SELECT * FROM departamento WHERE id_departamento = $1', [id]);
  return result.rows[0];
};

// Actualizar departamento
exports.updateDepartamento = async (id, nombre_departamento) => {
  const result = await pool.query(
    'UPDATE departamento SET nombre_departamento = $1 WHERE id_departamento = $2 RETURNING *',
    [nombre_departamento, id]
  );
  return result.rows[0];
};

// Eliminar departamento
exports.deleteDepartamento = async (id) => {
  const result = await pool.query('DELETE FROM departamento WHERE id_departamento = $1 RETURNING *', [id]);
  return result.rowCount > 0;
};