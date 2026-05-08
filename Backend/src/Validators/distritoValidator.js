/**
 * Validador para Distritos
 */
exports.validarDistrito = (req, res, next) => {
    const { nombre_distrito, id_departamento } = req.body;

    if (!nombre_distrito || nombre_distrito.trim().length < 3) {
        return res.status(400).json({ 
            success: false, 
            message: 'El nombre del distrito es requerido (mínimo 3 letras).' 
        });
    }

    if (!id_departamento) {
        return res.status(400).json({ 
            success: false, 
            message: 'El ID del departamento es obligatorio.' 
        });
    }

    next();
};
