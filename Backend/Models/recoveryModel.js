const pool = require('../db');

exports.saveRecoveryCode = async (email, code, expiracion) => {
  await pool.query(
    'INSERT INTO recuperacion_contrasena (email, codigo, expiracion) VALUES ($1, $2, $3)',
    [email, code, expiracion]
  );
};

exports.getRecoveryCode = async (email, code) => {
  const result = await pool.query(
    'SELECT * FROM recuperacion_contrasena WHERE email = $1 AND codigo = $2 ORDER BY expiracion DESC LIMIT 1',
    [email, code]
  );
  return result.rows[0];
};

// AÑADIR ESTA FUNCIÓN:
exports.deleteRecoveryCode = async (email, codigo) => {
  await pool.query(
    'DELETE FROM recuperacion_contrasena WHERE email = $1 AND codigo = $2',
    [email, codigo]
  );
};

