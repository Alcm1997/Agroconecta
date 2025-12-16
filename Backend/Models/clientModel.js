const pool = require('../db');

// Crear cliente (ya está bien, solo agregar estado por defecto)
exports.createClient = async (data) => {
  const {
    nombres,
    apellidos,
    razon_social,
    numero_documento,
    email,
    telefono,
    direccion,
    id_distrito,
    tipo_cliente,
    contrasena
  } = data;

  const query = `
    INSERT INTO cliente (
      nombres, apellidos, razon_social, numero_documento, email, telefono, 
      direccion, id_distrito, tipo_cliente, contrasena, estado
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'Activo')
    RETURNING *;
  `;
  const values = [
    nombres || null,
    apellidos || null,
    razon_social || null,
    numero_documento,
    email,
    telefono,
    direccion,
    id_distrito,
    tipo_cliente,
    contrasena
  ];
  const result = await pool.query(query, values);
  return result.rows[0];
};

// Obtener todos los clientes ACTIVOS únicamente
exports.getAllClients = async () => {
  const result = await pool.query('SELECT * FROM cliente WHERE estado = $1', ['Activo']);
  return result.rows;
};

// Obtener cliente por ID (solo si está activo)
exports.getClientById = async (id) => {
  const result = await pool.query('SELECT * FROM cliente WHERE id_cliente = $1 AND estado = $2', [id, 'Activo']);
  return result.rows[0];
};

// Obtener cliente por email (solo si está activo) - IMPORTANTE para login
exports.getClientByEmail = async (email) => {
  const query = 'SELECT * FROM cliente WHERE email = $1 AND estado = $2';
  const result = await pool.query(query, [email, 'Activo']);
  return result.rows[0];
};

// Actualizar cliente
exports.updateClient = async (id, data) => {
  const {
    nombres,
    apellidos,
    razon_social,
    numero_documento,
    email,
    telefono,
    direccion,
    id_distrito,
    tipo_cliente,
    contrasena
  } = data;

  const query = `
    UPDATE cliente SET
      nombres = $1,
      apellidos = $2,
      razon_social = $3,
      numero_documento = $4,
      email = $5,
      telefono = $6,
      direccion = $7,
      id_distrito = $8,
      tipo_cliente = $9,
      contrasena = COALESCE($10, contrasena)
    WHERE id_cliente = $11 AND estado = 'Activo'
    RETURNING *;
  `;
  const values = [
    nombres || null,
    apellidos || null,
    razon_social || null,
    numero_documento,
    email,
    telefono,
    direccion,
    id_distrito,
    tipo_cliente,
    contrasena || null,
    id
  ];
  const result = await pool.query(query, values);
  return result.rows[0];
};

// ✅ CAMBIAR: Soft delete en lugar de eliminación física
exports.deleteClient = async (id) => {
  const result = await pool.query(
    'UPDATE cliente SET estado = $1 WHERE id_cliente = $2 AND estado = $3 RETURNING *', 
    ['Inactivo', id, 'Activo']
  );
  return result.rowCount > 0;
};

// Función específica para actualizar contraseña
exports.updatePassword = async (email, hashedPassword) => {
  const query = `
    UPDATE cliente 
    SET contrasena = $1
    WHERE email = $2 AND estado = 'Activo'
  `;
  
  await pool.query(query, [hashedPassword, email]);
};

// ✅ NUEVA FUNCIÓN: Para reactivar cliente si es necesario (admin)
exports.reactivateClient = async (id) => {
  const result = await pool.query(
    'UPDATE cliente SET estado = $1 WHERE id_cliente = $2 RETURNING *',
    ['Activo', id]
  );
  return result.rows[0];
};

// ✅ NUEVA FUNCIÓN: Para obtener cliente por email incluso si está inactivo (solo para recuperación)
exports.getClientByEmailAnyStatus = async (email) => {
  const query = 'SELECT * FROM cliente WHERE email = $1';
  const result = await pool.query(query, [email]);
  return result.rows[0];
};

exports.getClientByDocument = async (numero_documento) => {
  const query = 'SELECT * FROM cliente WHERE numero_documento = $1 AND estado = $2';
  const result = await pool.query(query, [numero_documento, 'Activo']);
  return result.rows[0];
};

// ✅ NUEVA FUNCIÓN: Verificar documento para actualización (excluir el cliente actual)
exports.getClientByDocumentExcluding = async (numero_documento, id_cliente) => {
  const query = 'SELECT * FROM cliente WHERE numero_documento = $1 AND estado = $2 AND id_cliente != $3';
  const result = await pool.query(query, [numero_documento, 'Activo', id_cliente]);
  return result.rows[0];
};

exports.getAllClientsAnyStatus = async () => {
  const result = await pool.query('SELECT * FROM cliente ORDER BY id_cliente DESC');
  return result.rows;
};

// Todos los clientes sin filtrar por estado
exports.getAllClientsAnyStatus = async () => {
  const { rows } = await pool.query('SELECT * FROM cliente ORDER BY id_cliente DESC');
  return rows;
};

// Reactivar
exports.reactivateClient = async (id) => {
  const { rows } = await pool.query(
    "UPDATE cliente SET estado = 'Activo' WHERE id_cliente = $1 RETURNING *",
    [id]
  );
  return rows[0];
};

// SOLO AGREGAR esta función si no existe
exports.obtenerPorId = async (id_cliente) => {
  try {
    const pool = require('../db');
    const query = `
      SELECT id_cliente, nombres, apellidos, numero_documento, telefono, email, 
             tipo_cliente, razon_social
      FROM cliente
      WHERE id_cliente = $1
      LIMIT 1
    `;
    const { rows } = await pool.query(query, [id_cliente]);
    return rows[0] || null;
  } catch (error) {
    console.error('Error en clientModel.obtenerPorId:', error);
    throw error;
  }
};