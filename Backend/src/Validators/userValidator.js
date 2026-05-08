/**
 * Validador para Usuarios (Personal Administrativo)
 */
exports.validarUsuario = (req, res, next) => {
    const { nombres, apellidos, email, username, contraseña } = req.body;
    const isUpdate = req.method === 'PUT';

    // 1. Validar campos obligatorios
    if (!nombres || nombres.trim().length < 2) {
        return res.status(400).json({ success: false, message: 'Nombres requeridos (mínimo 2 letras)' });
    }
    if (!apellidos || apellidos.trim().length < 2) {
        return res.status(400).json({ success: false, message: 'Apellidos requeridos (mínimo 2 letras)' });
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ success: false, message: 'Email inválido' });
    }
    if (!username || username.trim().length < 4) {
        return res.status(400).json({ success: false, message: 'Username requerido (mínimo 4 caracteres)' });
    }

    // 2. Validar contraseña (solo en creación o si se envía en actualización)
    if (!isUpdate || contraseña) {
        // Regex: 8-15 caracteres, al menos una letra, un número y un símbolo
        const passRegex = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])[A-Za-z\d!@#$%^&*(),.?":{}|<>]{8,15}$/;
        
        if (!contraseña || !passRegex.test(contraseña)) {
            return res.status(400).json({ 
                success: false, 
                message: 'La contraseña debe tener entre 8 y 15 caracteres, e incluir letras, números y al menos un símbolo.' 
            });
        }
    }

    next();
};
