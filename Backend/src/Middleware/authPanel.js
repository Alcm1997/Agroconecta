const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'No se proporcionó token.' });
    }

    // Verificamos el token con el secreto
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);

    // Añadimos los datos del usuario (del token) a la petición
    req.user = {
      id_usuario: decodedToken.id_usuario,
      username: decodedToken.username,
      cargo: decodedToken.cargo,
      nombres: decodedToken.nombres,
      apellidos: decodedToken.apellidos,
      email: decodedToken.email
    };

    next();
  } catch (error) {
    res.status(401).json({ message: 'Token no válido o expirado. No autorizado.' });
  }
};
