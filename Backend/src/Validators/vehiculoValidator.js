/**
 * Validador para Vehículos
 */
exports.validarVehiculo = (req, res, next) => {
    const { id_transportista, placa } = req.body;

    if (!id_transportista || isNaN(id_transportista)) {
        return res.status(400).json({
            success: false,
            message: 'Debe seleccionar un transportista válido'
        });
    }

    if (!placa || placa.trim().length < 6) {
        return res.status(400).json({
            success: false,
            message: 'La placa es requerida (mínimo 6 caracteres)'
        });
    }

    next();
};
