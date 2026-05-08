/**
 * Validador para Departamentos
 */
exports.validarDepartamento = (req, res, next) => {
    const { nombre_departamento } = req.body;

    if (!nombre_departamento || nombre_departamento.trim().length < 3) {
        return res.status(400).json({ 
            success: false, 
            message: 'El nombre del departamento es requerido (mínimo 3 letras).' 
        });
    }

    next();
};
