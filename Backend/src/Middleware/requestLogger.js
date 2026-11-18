/**
 * Middleware de logging HTTP para registrar método, ruta, código de estado y duración.
 * Se silencia automáticamente en entorno de pruebas (NODE_ENV === 'test').
 */

const COLORS = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  cyan: '\x1b[36m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  gray: '\x1b[90m'
};

function getStatusColor(status) {
  if (status >= 500) return COLORS.red;
  if (status >= 400) return COLORS.yellow;
  if (status >= 300) return COLORS.cyan;
  return COLORS.green;
}

module.exports = (req, res, next) => {
  if (process.env.NODE_ENV === 'test') {
    return next();
  }

  const start = process.hrtime.bigint();

  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - start) / 1e6;
    const status = res.statusCode;

    if (process.env.NODE_ENV === 'production') {
      console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} -> ${status} (${durationMs.toFixed(1)} ms)`);
      return;
    }

    const color = getStatusColor(status);
    console.log(
      `${COLORS.gray}[${new Date().toLocaleTimeString()}]${COLORS.reset} ` +
      `${req.method} ${req.originalUrl} -> ${color}${status}${COLORS.reset} ` +
      `${COLORS.gray}(${durationMs.toFixed(1)} ms)${COLORS.reset}`
    );
  });

  next();
};
