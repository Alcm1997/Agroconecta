const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    console.log('🔒 Header de autorización:', authHeader ? 'Presente' : 'Ausente'); // Debug
    
    const token = authHeader?.split(' ')[1];
    if (!token) {
      console.log('❌ No se proporcionó token'); // Debug
      return res.status(401).json({ message: 'No se proporcionó token.' });
    }

    // Verificamos el token con el secreto
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    console.log('✅ Token decodificado exitosamente:', decodedToken.username); // Debug

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
    console.error('💥 Error en authPanel middleware:', error.message); // Debug
    res.status(401).json({ message: 'Token no válido o expirado. No autorizado.' });
  }
};
