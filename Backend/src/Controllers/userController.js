const userService = require('../Services/userService');
const UserDTO = require('../DTOs/userDTO');

// Crear usuario interno
exports.createUser = async (req, res) => {
    try {
        const creado_por = req.user ? req.user.id_usuario : null;
        const newUser = await userService.crearUsuario({
            ...req.body,
            creado_por
        });
        
        res.status(201).json({
            success: true,
            message: 'Usuario creado correctamente',
            user: UserDTO.transform(newUser)
        });
    } catch (error) {
        console.error('❌ Error en createUser:', error);
        res.status(400).json({ success: false, message: error.message });
    }
};

// Obtener todos los usuarios
exports.getAllUsers = async (req, res) => {
    try {
        const users = await userService.listarTodos();
        res.json(UserDTO.transform(users));
    } catch (error) {
        console.error('❌ Error en getAllUsers:', error);
        res.status(500).json({ success: false, message: 'Error al obtener usuarios' });
    }
};

// Obtener usuario por ID
exports.getUserById = async (req, res) => {
    try {
        const user = await userService.obtenerPorId(req.params.id);
        res.json(UserDTO.transform(user));
    } catch (error) {
        res.status(error.message === 'Usuario no encontrado' ? 404 : 500).json({
            success: false,
            message: error.message
        });
    }
};

// Actualizar usuario
exports.updateUser = async (req, res) => {
    try {
        const updatedUser = await userService.actualizarUsuario(req.params.id, req.body);
        res.json({
            success: true,
            message: 'Usuario actualizado correctamente',
            user: UserDTO.transform(updatedUser)
        });
    } catch (error) {
        console.error('❌ Error en updateUser:', error);
        res.status(400).json({ success: false, message: error.message });
    }
};

// Desactivar usuario (soft delete)
exports.deactivateUser = async (req, res) => {
    try {
        await userService.cambiarEstado(req.params.id, 'Inactivo');
        res.json({ success: true, message: 'Usuario desactivado correctamente' });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// Activar usuario
exports.activateUser = async (req, res) => {
    try {
        const user = await userService.cambiarEstado(req.params.id, 'Activo');
        res.json({
            success: true,
            message: 'Usuario reactivado correctamente',
            user: UserDTO.transform(user)
        });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};
