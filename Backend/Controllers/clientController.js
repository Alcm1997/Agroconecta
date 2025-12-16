const clientModel = require('../Models/clientModel');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../db');

// Crear cliente
exports.registerClient = async (req, res) => {
  try {
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
    } = req.body;

    // Validaciones básicas
    if (!numero_documento || !email || !telefono || !direccion || !id_distrito || !tipo_cliente || !contrasena) {
      return res.status(400).json({ message: 'Faltan campos obligatorios.' });
    }

    // ✅ VALIDACIÓN: Verificar si el email ya existe
    const existingEmailClient = await clientModel.getClientByEmail(email);
    if (existingEmailClient) {
      return res.status(400).json({ message: 'Ya existe un cliente registrado con este correo electrónico.' });
    }

    // ✅ VALIDACIÓN: Verificar si el número de documento ya existe
    const existingDocumentClient = await clientModel.getClientByDocument(numero_documento);
    if (existingDocumentClient) {
      const docType = tipo_cliente === 'Natural' ? 'DNI' : 'RUC';
      return res.status(400).json({ message: `Ya existe un cliente registrado con este ${docType}.` });
    }

    if (tipo_cliente === 'Natural') {
      if (!nombres || !apellidos) {
        return res.status(400).json({ message: 'Nombres y apellidos son obligatorios para clientes naturales.' });
      }
      if (numero_documento.length !== 8 || !/^\d{8}$/.test(numero_documento)) {
        return res.status(400).json({ message: 'El DNI debe tener exactamente 8 dígitos numéricos.' });
      }
    } else if (tipo_cliente === 'Jurídica') {
      if (!razon_social) {
        return res.status(400).json({ message: 'Razón social es obligatoria para clientes jurídicos.' });
      }
      if (numero_documento.length !== 11 || !/^\d{11}$/.test(numero_documento)) {
        return res.status(400).json({ message: 'El RUC debe tener exactamente 11 dígitos numéricos.' });
      }
    } else {
      return res.status(400).json({ message: 'Tipo de cliente inválido.' });
    }

    // ✅ VALIDACIÓN: Email formato válido
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'El formato del correo electrónico no es válido.' });
    }

    // ✅ VALIDACIÓN: Teléfono (9 dígitos peruano)
    if (!/^\d{9}$/.test(telefono)) {
      return res.status(400).json({ message: 'El teléfono debe tener exactamente 9 dígitos.' });
    }

    // ✅ VALIDACIÓN: Contraseña mínima
    if (contrasena.length < 6) {
      return res.status(400).json({ message: 'La contraseña debe tener al menos 6 caracteres.' });
    }

    // Encriptar contraseña
    const hashedPassword = await bcrypt.hash(contrasena, 10);

    // Crear cliente usando el modelo
    const newClient = await clientModel.createClient({
      nombres,
      apellidos,
      razon_social,
      numero_documento,
      email,
      telefono,
      direccion,
      id_distrito,
      tipo_cliente,
      contrasena: hashedPassword
    });

    res.status(201).json({ message: 'Cliente registrado correctamente.', client: newClient });
  } catch (error) {
    console.error('Error en registerClient:', error);

    // ✅ MANEJO: Error de constraint UNIQUE de la base de datos
    if (error.code === '23505') { // Código de error PostgreSQL para violación UNIQUE
      if (error.constraint === 'unique_numero_documento') {
        const docType = req.body.tipo_cliente === 'Natural' ? 'DNI' : 'RUC';
        return res.status(400).json({ message: `Ya existe un cliente registrado con este ${docType}.` });
      }
      if (error.constraint === 'cliente_email_key') {
        return res.status(400).json({ message: 'Ya existe un cliente registrado con este correo electrónico.' });
      }
    }

    res.status(500).json({ message: 'Error en el servidor.', error: error.message });
  }
};

// Obtener todos los clientes
exports.getAllClients = async (req, res) => {
  try {
    const clients = await clientModel.getAllClients();
    res.json(clients);
  } catch (error) {
    res.status(500).json({ message: 'Error en el servidor.', error: error.message });
  }
};

// Obtener cliente por ID
exports.getClientById = async (req, res) => {
  try {
    const client = await clientModel.getClientById(req.params.id);
    if (!client) return res.status(404).json({ message: 'Cliente no encontrado.' });
    res.json(client);
  } catch (error) {
    res.status(500).json({ message: 'Error en el servidor.', error: error.message });
  }
};

// Actualizar cliente
exports.updateClient = async (id, data) => {
  try {
    const { contrasena, numero_documento, email, telefono, tipo_cliente, ...otherData } = req.body;

    // ✅ VALIDACIÓN: Verificar si el nuevo email ya existe (excluyendo el cliente actual)
    if (email) {
      const existingEmailClient = await pool.query(
        'SELECT * FROM cliente WHERE email = $1 AND estado = $2 AND id_cliente != $3',
        [email, 'Activo', req.params.id]
      );
      if (existingEmailClient.rows.length > 0) {
        return res.status(400).json({ message: 'Ya existe otro cliente con este correo electrónico.' });
      }
    }

    // ✅ VALIDACIÓN: Verificar si el nuevo documento ya existe (excluyendo el cliente actual)
    if (numero_documento) {
      const existingDocumentClient = await clientModel.getClientByDocumentExcluding(numero_documento, req.params.id);
      if (existingDocumentClient) {
        const docType = tipo_cliente === 'Natural' ? 'DNI' : 'RUC';
        return res.status(400).json({ message: `Ya existe otro cliente con este ${docType}.` });
      }

      // Validar formato según tipo
      if (tipo_cliente === 'Natural') {
        if (numero_documento.length !== 8 || !/^\d{8}$/.test(numero_documento)) {
          return res.status(400).json({ message: 'El DNI debe tener exactamente 8 dígitos numéricos.' });
        }
      } else if (tipo_cliente === 'Jurídica') {
        if (numero_documento.length !== 11 || !/^\d{11}$/.test(numero_documento)) {
          return res.status(400).json({ message: 'El RUC debe tener exactamente 11 dígitos numéricos.' });
        }
      }
    }

    // ✅ VALIDACIÓN: Teléfono si se está actualizando
    if (telefono && !/^\d{9}$/.test(telefono)) {
      return res.status(400).json({ message: 'El teléfono debe tener exactamente 9 dígitos.' });
    }

    let hashedPassword = undefined;
    if (contrasena) {
      if (contrasena.length < 6) {
        return res.status(400).json({ message: 'La contraseña debe tener al menos 6 caracteres.' });
      }
      hashedPassword = await bcrypt.hash(contrasena, 10);
    }

    const updatedClient = await clientModel.updateClient(req.params.id, {
      ...otherData,
      numero_documento,
      email,
      telefono,
      tipo_cliente,
      contrasena: hashedPassword
    });

    if (!updatedClient) return res.status(404).json({ message: 'Cliente no encontrado.' });
    res.json({ message: 'Cliente actualizado.', client: updatedClient });
  } catch (error) {
    console.error('Error en updateClient:', error);

    // ✅ MANEJO: Error de constraint UNIQUE
    if (error.code === '23505') {
      if (error.constraint === 'unique_numero_documento') {
        const docType = req.body.tipo_cliente === 'Natural' ? 'DNI' : 'RUC';
        return res.status(400).json({ message: `Ya existe otro cliente con este ${docType}.` });
      }
      if (error.constraint === 'cliente_email_key') {
        return res.status(400).json({ message: 'Ya existe otro cliente con este correo electrónico.' });
      }
    }

    res.status(500).json({ message: 'Error en el servidor.', error: error.message });
  }
};

// Eliminar cliente
exports.deleteClient = async (req, res) => {
  try {
    const deleted = await clientModel.deleteClient(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Cliente no encontrado.' });
    res.json({ message: 'Cliente eliminado.' });
  } catch (error) {
    res.status(500).json({ message: 'Error en el servidor.', error: error.message });
  }
};

// ✅ ACTUALIZAR: Verificar email para recuperación (debe buscar cualquier estado)
exports.checkClientByEmail = async (req, res) => {
  const { email } = req.body;
  try {
    // Para recuperación, buscar cliente independientemente del estado
    const client = await clientModel.getClientByEmailAnyStatus(email);
    if (!client) {
      return res.status(404).json({ message: 'No existe una cuenta con ese correo.' });
    }

    // Verificar si está inactivo
    if (client.estado === 'Inactivo') {
      return res.status(400).json({
        message: 'Esta cuenta está inactiva. Contacta con soporte para reactivarla.'
      });
    }

    res.json({ message: 'Cliente encontrado.' });
  } catch (error) {
    res.status(500).json({ message: 'Error en el servidor.' });
  }
};

// Login de cliente por correo y contraseña
exports.loginClient = async (req, res) => {
  const { email, contrasena } = req.body;
  try {
    // Buscar cliente activo únicamente
    const client = await clientModel.getClientByEmail(email);
    if (!client) {
      return res.status(400).json({
        message: 'Correo o contraseña incorrectos, o cuenta inactiva.'
      });
    }

    const validPassword = await bcrypt.compare(contrasena, client.contrasena);
    if (!validPassword) {
      return res.status(400).json({ message: 'Correo o contraseña incorrectos.' });
    }

    const token = jwt.sign(
      {
        id_cliente: client.id_cliente,
        email: client.email
      },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Devolver token + datos del cliente para sincronización del carrito
    res.json({
      token,
      cliente: {
        id_cliente: client.id_cliente,
        tipo_cliente: client.tipo_cliente,
        nombres: client.nombres,
        apellidos: client.apellidos,
        razon_social: client.razon_social,
        nombre_comercial: client.nombre_comercial,
        correo: client.email
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error en el servidor.' });
  }
};


exports.getProfile = async (req, res) => {
  try {
    // El id_cliente lo obtenemos del token que ya fue verificado por el middleware
    const client = await clientModel.getClientById(req.user.id_cliente);

    if (!client) {
      return res.status(404).json({ message: 'Cliente no encontrado.' });
    }

    // ¡Importante! Nunca devuelvas la contraseña
    delete client.contrasena;

    res.json(client);
  } catch (error) {
    console.error('Error en getProfile:', error);
    res.status(500).json({ message: 'Error en el servidor al obtener el perfil.' });
  }
};

// Actualizar perfil del cliente autenticado
exports.updateProfile = async (req, res) => {
  try {
    const clientId = req.user.id_cliente; // Del middleware de autenticación
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
    } = req.body;

    // ✅ VALIDACIÓN: Verificar si el nuevo documento ya existe (excluyendo el cliente actual)
    if (numero_documento) {
      const existingDocumentClient = await clientModel.getClientByDocumentExcluding(numero_documento, clientId);
      if (existingDocumentClient) {
        const docType = tipo_cliente === 'Natural' ? 'DNI' : 'RUC';
        return res.status(400).json({
          message: `Ya existe otro cliente registrado con este ${docType}: ${numero_documento}`,
          field: 'numero_documento'
        });
      }

      // ✅ VALIDACIÓN: Formato según tipo de cliente
      if (tipo_cliente === 'Natural') {
        if (numero_documento.length !== 8 || !/^\d{8}$/.test(numero_documento)) {
          return res.status(400).json({
            message: 'El DNI debe tener exactamente 8 dígitos numéricos.',
            field: 'numero_documento'
          });
        }
      } else if (tipo_cliente === 'Jurídica') {
        if (numero_documento.length !== 11 || !/^\d{11}$/.test(numero_documento)) {
          return res.status(400).json({
            message: 'El RUC debe tener exactamente 11 dígitos numéricos.',
            field: 'numero_documento'
          });
        }
      }
    }

    // ✅ VALIDACIÓN: Verificar si el nuevo email ya existe (excluyendo el cliente actual)
    if (email) {
      const existingEmailClient = await pool.query(
        'SELECT * FROM cliente WHERE email = $1 AND estado = $2 AND id_cliente != $3',
        [email, 'Activo', clientId]
      );
      if (existingEmailClient.rows.length > 0) {
        return res.status(400).json({
          message: 'Ya existe otro cliente registrado con este correo electrónico.',
          field: 'email'
        });
      }
    }

    // ✅ VALIDACIÓN: Teléfono formato válido
    if (telefono && !/^\d{9}$/.test(telefono)) {
      return res.status(400).json({
        message: 'El teléfono debe tener exactamente 9 dígitos.',
        field: 'telefono'
      });
    }

    // ✅ VALIDACIÓN: Email formato válido
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          message: 'El formato del correo electrónico no es válido.',
          field: 'email'
        });
      }
    }

    // Preparar datos para actualización
    let updateData = {
      nombres,
      apellidos,
      razon_social,
      numero_documento,
      email,
      telefono,
      direccion,
      id_distrito,
      tipo_cliente
    };

    // ✅ VALIDACIÓN: Contraseña si se está actualizando
    if (contrasena && contrasena.trim() !== '') {
      if (contrasena.length < 6) {
        return res.status(400).json({
          message: 'La contraseña debe tener al menos 6 caracteres.',
          field: 'contrasena'
        });
      }
      updateData.contrasena = await bcrypt.hash(contrasena, 10);
    }

    // Actualizar en la base de datos
    const updatedClient = await clientModel.updateClient(clientId, updateData);

    if (!updatedClient) {
      return res.status(404).json({ message: 'Cliente no encontrado.' });
    }

    // Respuesta exitosa (sin incluir la contraseña)
    const { contrasena: _, ...clientResponse } = updatedClient;

    res.json({
      message: 'Perfil actualizado correctamente.',
      client: clientResponse
    });

  } catch (error) {
    console.error('Error en updateProfile:', error);

    // ✅ MANEJO: Error de constraint UNIQUE de PostgreSQL
    if (error.code === '23505') {
      if (error.constraint === 'unique_numero_documento') {
        const docType = req.body.tipo_cliente === 'Natural' ? 'DNI' : 'RUC';
        return res.status(400).json({
          message: `Ya existe otro cliente registrado con este ${docType}.`,
          field: 'numero_documento'
        });
      }
      if (error.constraint === 'cliente_email_key') {
        return res.status(400).json({
          message: 'Ya existe otro cliente registrado con este correo electrónico.',
          field: 'email'
        });
      }
    }

    res.status(500).json({ message: 'Error interno del servidor.', error: error.message });
  }
};


// ✅ ACTUALIZAR: Soft delete en lugar de eliminación física
exports.deleteMyAccount = async (req, res) => {
  try {
    const clienteId = req.user.id_cliente;

    // Verificar que el cliente existe y está activo
    const client = await clientModel.getClientById(clienteId);
    if (!client) {
      return res.status(404).json({ message: 'Cliente no encontrado o ya inactivo.' });
    }

    // Verificar pedidos pendientes
    const pedidosPendientes = await pool.query(
      'SELECT COUNT(*) as total FROM pedido p WHERE p.id_cliente = $1 AND p.estado = $2',
      [clienteId, 'Pendiente']
    );

    if (parseInt(pedidosPendientes.rows[0].count) > 0) {
      return res.status(400).json({
        message: 'No puedes desactivar tu cuenta porque tienes pedidos pendientes. Contacta con soporte.'
      });
    }

    // ✅ SOFT DELETE: Cambiar estado a Inactivo
    const deactivated = await clientModel.deleteClient(clienteId);

    if (!deactivated) {
      return res.status(404).json({ message: 'No se pudo desactivar la cuenta.' });
    }

    res.json({
      message: 'Cuenta desactivada correctamente. Contacta con soporte si deseas reactivarla.'
    });

  } catch (error) {
    console.error('Error al desactivar cuenta:', error);
    res.status(500).json({ message: 'Error interno del servidor', error: error.message });
  }
};

// ✅ NUEVA FUNCIÓN: Verificar documento duplicado
exports.checkClientByDocument = async (req, res) => {
  const { numero_documento } = req.body;
  try {
    const client = await clientModel.getClientByDocument(numero_documento);
    if (client) {
      return res.status(400).json({ message: 'Este número de documento ya está registrado.' });
    }
    res.json({ message: 'Documento disponible.' });
  } catch (error) {
    res.status(500).json({ message: 'Error en el servidor.' });
  }
};

// Listar TODOS los clientes para el panel (incluye inactivos)
exports.getAllClientsPanel = async (req, res) => {
  try {
    const data = await clientModel.getAllClientsAnyStatus();
    res.json(data);
  } catch (e) {
    res.status(500).json({ message: 'Error al obtener clientes.' });
  }
};

exports.reactivateClientByAdmin = async (req, res) => {
  try {
    const updated = await clientModel.reactivateClient(req.params.id);
    if (!updated) return res.status(404).json({ message: 'Cliente no encontrado' });
    res.json({ message: 'Cliente reactivado', client: updated });
  } catch (e) {
    res.status(500).json({ message: 'Error al reactivar cliente.' });
  }
};
// 
exports.me = async (req, res) => {
  try {
    console.log('=== /api/client/me invoked ===');
    console.log('Auth header:', req.headers.authorization);
    const id_cliente = req.cliente?.id_cliente || req.user?.id_cliente;
    console.log('id_cliente resolved:', id_cliente);

    if (!id_cliente) {
      return res.status(401).json({ success: false, message: 'No autenticado' });
    }

    const clientModel = require('../Models/clientModel');
    const cliente = await clientModel.obtenerPorId(id_cliente);
    console.log('cliente from DB:', cliente);

    if (!cliente) {
      return res.status(404).json({ success: false, message: 'Cliente no encontrado' });
    }

    // Respuesta según tipo de cliente
    const out = {
      nombres: cliente.nombres || cliente.razon_social || '',
      apellidos: cliente.apellidos || '',
      numero_documento: cliente.numero_documento || '',
      telefono: cliente.telefono || '',
      email: cliente.email || '',
      tipo_cliente: cliente.tipo_cliente || 'natural'
    };

    return res.json({ success: true, cliente: out });
  } catch (e) {
    console.error('Error en clientController.me:', e);
    return res.status(500).json({ success: false, message: 'Error interno' });
  }
};