const userModel = require('../Models/userModel');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Login para usuarios internos (panel)
exports.loginPanel = async (req, res) => {
  const { username, password } = req.body;

  console.log('🔐 Intento de login:', { username }); // Debug

  try {
    const user = await userModel.getUserByUsername(username);
    console.log('👤 Usuario encontrado:', user ? 'Sí' : 'No'); // Debug

    if (!user || user.estado !== 'Activo') {
      console.log('❌ Usuario inactivo o no encontrado'); // Debug
      return res.status(401).json({ message: 'Usuario o contraseña incorrectos o usuario inactivo' });
    }

    const validPassword = await bcrypt.compare(password, user.contraseña);
    console.log('🔑 Contraseña válida:', validPassword); // Debug

    if (!validPassword) {
      return res.status(401).json({ message: 'Usuario o contraseña incorrectos' });
    }

    // Generar token JWT con información completa
    const token = jwt.sign({
      id_usuario: user.id_usuario,
      username: user.username,
      cargo: user.id_cargo,
      nombres: user.nombres,
      apellidos: user.apellidos,
      email: user.email
    }, process.env.JWT_SECRET, { expiresIn: '2h' });

    console.log('✅ Token generado exitosamente'); // Debug

    res.json({
      message: 'Login exitoso',
      token,
      user: {
        id_usuario: user.id_usuario,
        nombres: user.nombres,
        apellidos: user.apellidos,
        email: user.email,
        username: user.username,
        cargo: user.id_cargo,
        estado: user.estado
      }
    });
  } catch (error) {
    console.error('💥 Error en loginPanel:', error);
    res.status(500).json({ message: 'Error en el servidor', error: error.message });
  }
};
