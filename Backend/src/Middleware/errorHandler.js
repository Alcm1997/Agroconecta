const path = require('path');

/**
 * Middleware global de manejo de errores para Express.
 * Diferencia respuestas JSON para /api/* de vistas HTML para el navegador
 * y oculta detalles internos en producción.
 */
module.exports = (err, req, res, next) => {
  const statusCode = err.status || err.statusCode || 500;

  if (process.env.NODE_ENV !== 'test') {
    console.error(`[ERROR ${statusCode}] ${req.method} ${req.originalUrl}:`, err.stack || err.message);
  }

  if (res.headersSent) {
    return next(err);
  }

  const isApiRequest = req.path.startsWith('/api/') || req.xhr || !req.accepts('html');
  if (isApiRequest) {
    const isProduction = process.env.NODE_ENV === 'production';
    return res.status(statusCode).json({
      success: false,
      message: isProduction && statusCode >= 500
        ? 'Error interno del servidor'
        : (err.message || 'Error interno del servidor')
    });
  }

  return res
    .status(statusCode)
    .sendFile(path.join(__dirname, '../../../Frontend/html/errors/500.html'));
};
