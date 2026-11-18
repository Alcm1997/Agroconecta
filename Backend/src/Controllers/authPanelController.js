const userModel = require('../Models/userModel');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Login para usuarios internos (panel)
exports.loginPanel = async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await userModel.getUserByUsername(username);

    if (!user || user.estado !== 'Activo') {
      return res.status(401).json({ message: 'Usuario o contraseña incorrectos o usuario inactivo' });
    }

    const validPassword = await bcrypt.compare(password, user.contraseña);

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
