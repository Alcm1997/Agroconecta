const pool = require('../db');

exports.createCargo = async (nombre_cargo) => {
  const result = await pool.query(
    'INSERT INTO cargo (nombre_cargo) VALUES ($1) RETURNING *',
    [nombre_cargo]
  );
  return result.rows[0];
};

exports.getAllCargos = async () => {
  const result = await pool.query('SELECT * FROM cargo');
  return result.rows;
};

exports.getCargoById = async (id) => {
  const result = await pool.query('SELECT * FROM cargo WHERE id_cargo = $1', [id]);
  return result.rows[0];
};

exports.updateCargo = async (id, nombre_cargo) => {
  const result = await pool.query(
    'UPDATE cargo SET nombre_cargo = $1 WHERE id_cargo = $2 RETURNING *',
    [nombre_cargo, id]
  );
  return result.rows[0];
};

exports.deleteCargo = async (id) => {
  const result = await pool.query('DELETE FROM cargo WHERE id_cargo = $1 RETURNING *', [id]);
  return result.rowCount > 0;
};