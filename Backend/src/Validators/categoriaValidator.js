/**
 * Validador para Categorías
 */
exports.validarCategoria = (req, res, next) => {
    const { descripcion } = req.body;

    if (!descripcion || descripcion.trim().length < 3) {
        return res.status(400).json({
            success: false,
            message: 'La descripción es requerida (mínimo 3 caracteres)'
        });
    }

    next();
};
