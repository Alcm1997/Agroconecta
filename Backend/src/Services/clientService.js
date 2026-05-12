/**
 * clientService.js - Lógica de negocio para Clientes
 */
const clientModel = require('../Models/clientModel');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');

exports.registrar = async (datos) => {
    // 1. Verificar duplicados (Email)
    const existingEmail = await clientModel.getClientByEmailAnyStatus(datos.email);
    if (existingEmail) {
        throw new Error('Ya existe un cliente registrado con este correo electrónico.');
    }

    // 2. Verificar duplicados (Documento)
    const existingDoc = await clientModel.getClientByDocument(datos.numero_documento);
    if (existingDoc) {
        const docType = datos.tipo_cliente === 'Natural' ? 'DNI' : 'RUC';
        throw new Error(`Ya existe un cliente registrado con este ${docType}.`);
    }

    // 3. Encriptar contraseña
    datos.contrasena = await bcrypt.hash(datos.contrasena, 10);

    // 4. Crear en DB
    return await clientModel.createClient(datos);
};

exports.autenticar = async (email, password) => {
    // 1. Buscar cliente activo
    const client = await clientModel.getClientByEmail(email);
    if (!client) {
        throw new Error('Correo o contraseña incorrectos, o cuenta inactiva.');
    }

    // 2. Validar contraseña
    const validPassword = await bcrypt.compare(password, client.contrasena);
    if (!validPassword) {
        throw new Error('Correo o contraseña incorrectos.');
    }

    // 3. Generar JWT
    const token = jwt.sign(
        { id_cliente: client.id_cliente, email: client.email },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
    );

    return { token, client };
};

exports.obtenerPerfil = async (id) => {
    const client = await clientModel.getClientById(id);
    if (!client) throw new Error('Cliente no encontrado.');
    return client;
};

exports.actualizarPerfil = async (id, datos) => {
    // 1. Verificar duplicados de documento excluyendo al actual
    if (datos.numero_documento) {
        const existingDoc = await clientModel.getClientByDocumentExcluding(datos.numero_documento, id);
        if (existingDoc) {
            throw new Error('Este número de documento ya está registrado por otro cliente.');
        }
    }

    // 2. Verificar duplicados de email
    if (datos.email) {
        const existingEmail = await pool.query(
            'SELECT * FROM cliente WHERE email = $1 AND estado = $2 AND id_cliente != $3',
            [datos.email, 'Activo', id]
        );
        if (existingEmail.rows.length > 0) {
            throw new Error('Este correo electrónico ya está registrado por otro cliente.');
        }
    }

    // 3. Encriptar contraseña si se envía
    if (datos.contrasena && datos.contrasena.trim() !== '') {
        datos.contrasena = await bcrypt.hash(datos.contrasena, 10);
    } else {
        delete datos.contrasena; // No sobreescribir con null/vacío
    }

    const updated = await clientModel.updateClient(id, datos);
    if (!updated) throw new Error('No se pudo actualizar el perfil.');
    
    return updated;
};

exports.desactivarCuenta = async (id) => {
    // Verificar pedidos pendientes
    const pedidosPendientes = await pool.query(
        'SELECT COUNT(*) as total FROM pedido p WHERE p.id_cliente = $1 AND p.estado = $2',
        [id, 'Pendiente']
    );

    if (parseInt(pedidosPendientes.rows[0].total) > 0) {
        throw new Error('No puedes desactivar tu cuenta porque tienes pedidos pendientes.');
    }

    const result = await clientModel.deleteClient(id);
    if (!result) throw new Error('No se pudo desactivar la cuenta.');
    
    return true;
};

exports.listarTodos = async () => {
    return await clientModel.getAllClients();
};

exports.listarTodosPanel = async () => {
    return await clientModel.getAllClientsAnyStatus();
};

exports.reactivarCliente = async (id) => {
    const updated = await clientModel.reactivateClient(id);
    if (!updated) throw new Error('Cliente no encontrado');
    return updated;
};

exports.obtenerPorEmailAnyStatus = async (email) => {
    return await clientModel.getClientByEmailAnyStatus(email);
};

exports.obtenerPorDocumento = async (numero_documento) => {
    return await clientModel.getClientByDocument(numero_documento);
};
