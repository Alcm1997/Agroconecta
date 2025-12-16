const userModel = require('../Models/userModel');
const bcrypt = require('bcrypt');

// Crear usuario interno
exports.createUser = async (req, res) => {
  try {
    const { nombres, apellidos, email, contraseña, username, id_cargo, estado } = req.body;
    const hashedPassword = await bcrypt.hash(contraseña, 10);
    const creado_por = req.user ? req.user.id_usuario : null; // Si viene de un admin autenticado
    const newUser = await userModel.createUser({
      nombres,
      apellidos,
      email,
      contraseña: hashedPassword,
      username,
      id_cargo,
      estado,
      creado_por
    });
    res.status(201).json({ message: 'Usuario creado correctamente', user: newUser });
  } catch (error) {
    res.status(500).json({ message: 'Error en el servidor', error: error.message });
  }
};

// Obtener todos los usuarios
exports.getAllUsers = async (req, res) => {
  try {
    const users = await userModel.getAllUsers();
    console.log('👥 Usuarios encontrados:', users.length); // Debug
    console.log('📋 Datos usuarios:', users); // Debug
    
    // ✅ AGREGAR HEADERS CORS EXPLÍCITOS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');
    
    res.json(users);
  } catch (error) {
    console.error('💥 Error en getAllUsers:', error); // Debug
    res.status(500).json({ message: 'Error en el servidor', error: error.message });
  }
};

// Obtener usuario por ID
exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await userModel.getUserById(id);
    
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    
    // ✅ ASEGURAR QUE DEVUELVE LOS DATOS CORRECTOS
    res.json({
      id_usuario: user.id_usuario,
      nombres: user.nombres,
      apellidos: user.apellidos,
      email: user.email,
      username: user.username,
      id_cargo: user.id_cargo, // ← Importante para el formulario
      estado: user.estado
    });
  } catch (error) {
    console.error('Error obteniendo usuario:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
};

// Actualizar usuario
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombres, apellidos, email, username, id_cargo } = req.body;
    
    console.log('🔄 Datos recibidos para actualizar:', req.body);
    
    const updatedUser = await userModel.updateUser(id, {
      nombres,
      apellidos,  
      email,
      username,
      id_cargo,
      estado: 'Activo' // ✅ AGREGAR ESTADO POR DEFECTO
    });
    
    res.json({ message: 'Usuario actualizado correctamente', user: updatedUser });
  } catch (error) {
    console.error('Error actualizando usuario:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
};

// Desactivar usuario (soft delete)
exports.deactivateUser = async (req, res) => {
  try {
    const id = req.params.id;
    const result = await userModel.deactivateUser(id);
    if (result) {
      res.json({ message: 'Usuario desactivado correctamente.' });
    } else {
      res.status(404).json({ message: 'Usuario no encontrado.' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error al desactivar usuario.' });
  }
};

// Activar usuario
exports.activateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await userModel.activateUser(id);
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });
    res.json({ message: 'Usuario reactivado', user });
  } catch (error) {
    res.status(500).json({ message: 'Error al reactivar usuario' });
  }
};
