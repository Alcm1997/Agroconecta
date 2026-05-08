/**
 * Validador para Unidades de Medida
 */
exports.validarUnidad = (req, res, next) => {
    const { descripcion } = req.body;

    if (!descripcion || descripcion.trim().length < 1) {
        return res.status(400).json({
            success: false,
            message: 'La descripción de la unidad es requerida'
        });
    }

    next();
};
