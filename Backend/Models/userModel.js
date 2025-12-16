const pool = require('../db');

// Crear usuario interno
exports.createUser = async (data) => {
  const {
    nombres,
    apellidos,
    email,
    contraseña,
    username,
    id_cargo,
    estado,
    creado_por
  } = data;

  const query = `
    INSERT INTO usuario (
      nombres, apellidos, email, contraseña, username, id_cargo, estado, fecha_registro, creado_por
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP, $8)
    RETURNING *;
  `;
  const values = [
    nombres,
    apellidos,
    email,
    contraseña,
    username,
    id_cargo,
    estado || 'Activo',
    creado_por || null
  ];
  const result = await pool.query(query, values);
  return result.rows[0];
};

// Obtener todos los usuarios internos
exports.getAllUsers = async () => {
  const query = `
    SELECT 
      u.id_usuario,
      u.nombres,
      u.apellidos,
      u.email,
      u.username,
      u.estado,
      u.fecha_registro,
      c.nombre_cargo as cargo
    FROM usuario u
    LEFT JOIN cargo c ON u.id_cargo = c.id_cargo
    ORDER BY u.fecha_registro DESC
  `;
  const result = await pool.query(query);
  return result.rows;
};

// Obtener usuario por ID
exports.getUserById = async (id) => {
  const result = await pool.query('SELECT * FROM usuario WHERE id_usuario = $1', [id]);
  return result.rows[0];
};

// Actualizar usuario
exports.updateUser = async (id, data) => {
  const {
    nombres,
    apellidos,
    email,
    username,
    id_cargo,
    estado
  } = data;

  const query = `
    UPDATE usuario SET
      nombres = $1,
      apellidos = $2,
      email = $3,
      username = $4,
      id_cargo = $5,
      estado = $6
    WHERE id_usuario = $7
    RETURNING *;
  `;
  const values = [
    nombres,
    apellidos,
    email,
    username,
    id_cargo,
    estado,
    id
  ];
  const result = await pool.query(query, values);
  return result.rows[0];
};

// Desactivar usuario (soft delete)
exports.deactivateUser = async (id) => {
  const query = 'UPDATE usuario SET estado = $1 WHERE id_usuario = $2';
  const values = ['Inactivo', id];
  const result = await pool.query(query, values);
  return result.rowCount > 0;
};

// Buscar usuario por username
exports.getUserByUsername = async (username) => {
  const result = await pool.query('SELECT * FROM usuario WHERE username = $1', [username]);
  return result.rows[0];
};

// ...existing code...
exports.activateUser = async (id) => {
  const query = `
    UPDATE usuario
    SET estado = 'Activo'
    WHERE id_usuario = $1
    RETURNING *;
  `;
  const { rows } = await pool.query(query, [id]);
  return rows[0];
};
// ...existing code...