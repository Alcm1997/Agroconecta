/**
 * Validador para el flujo de Asesorías
 */

exports.validarConsulta = (req, res, next) => {
    const { nombre, email, mensaje } = req.body;

    // Validación de Nombre
    if (!nombre || nombre.trim().length < 2) {
        return res.status(400).json({
            success: false,
            message: 'El nombre es requerido (mínimo 2 caracteres)'
        });
    }

    // Validación de Email (Regex estándar)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
        return res.status(400).json({
            success: false,
            message: 'Email inválido'
        });
    }

    // Validación de Mensaje
    if (!mensaje || mensaje.trim().length < 10) {
        return res.status(400).json({
            success: false,
            message: 'El mensaje es requerido (mínimo 10 caracteres)'
        });
    }

    // Si todo está bien, pasamos al siguiente paso (el controlador)
    next();
};
