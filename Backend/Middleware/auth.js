const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  try {
    // El token viene en el formato "Bearer <token>"
    const token = req.headers.authorization.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'No se proporcionó token.' });
    }

    // Verificamos el token con el secreto
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    
    // Añadimos los datos del usuario (del token) a la petición para usarlo después
    req.user = { id_cliente: decodedToken.id_cliente, email: decodedToken.email };
    
    next(); // Si todo está bien, continuamos a la siguiente función (el controlador)
  } catch (error) {
    res.status(401).json({ message: 'Token no válido o expirado. No autorizado.' });
  }
};