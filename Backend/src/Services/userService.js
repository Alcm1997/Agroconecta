const userModel = require('../Models/userModel');
const bcrypt = require('bcrypt');

/**
 * Servicio para gestionar la lógica de negocio de Usuarios (Staff)
 */
exports.listarTodos = async () => {
    return await userModel.getAllUsers();
};

exports.obtenerPorId = async (id) => {
    const user = await userModel.getUserById(id);
    if (!user) {
        throw new Error('Usuario no encontrado');
    }
    return user;
};

exports.crearUsuario = async (datos) => {
    // 1. Validar Username único
    const existeUsername = await userModel.getUserByUsername(datos.username);
    if (existeUsername) {
        throw new Error('El nombre de usuario ya está en uso');
    }

    // 2. Validar Email único
    const existeEmail = await userModel.getUserByEmail(datos.email);
    if (existeEmail) {
        throw new Error('El email ya está registrado');
    }

    // 3. Cifrar contraseña
    const hashedPassword = await bcrypt.hash(datos.contraseña, 10);
    
    return await userModel.createUser({
        ...datos,
        contraseña: hashedPassword
    });
};

exports.actualizarUsuario = async (id, datos) => {
    // 0. Obtener datos actuales para no perder el estado o cargo si no se envían
    const usuarioActual = await userModel.getUserById(id);
    if (!usuarioActual) {
        throw new Error('Usuario no encontrado');
    }

    // 1. Validar Username (excluyendo el actual)
    const existeUsername = await userModel.getUserByUsername(datos.username);
    if (existeUsername && existeUsername.id_usuario != id) {
        throw new Error('El nombre de usuario ya está en uso por otro usuario');
    }

    // 2. Validar Email (excluyendo el actual)
    const existeEmail = await userModel.getUserByEmail(datos.email);
    if (existeEmail && existeEmail.id_usuario != id) {
        throw new Error('El email ya está en uso por otro usuario');
    }

    // 3. Si hay contraseña nueva, cifrarla
    if (datos.contraseña) {
        datos.contraseña = await bcrypt.hash(datos.contraseña, 10);
    }

    // 4. Combinar datos: usamos los nuevos, pero si faltan, mantenemos los actuales
    const datosActualizados = {
        nombres: datos.nombres || usuarioActual.nombres,
        apellidos: datos.apellidos || usuarioActual.apellidos,
        email: datos.email || usuarioActual.email,
        username: datos.username || usuarioActual.username,
        id_cargo: datos.id_cargo || usuarioActual.id_cargo,
        estado: datos.estado || usuarioActual.estado, // ← Aquí está la clave
        contraseña: datos.contraseña || usuarioActual.contraseña
    };

    const updatedUser = await userModel.updateUser(id, datosActualizados);
    return updatedUser;
};

exports.cambiarEstado = async (id, nuevoEstado) => {
    if (nuevoEstado === 'Activo') {
        return await userModel.activateUser(id);
    } else {
        return await userModel.deactivateUser(id);
    }
};
