/**
 * Validador para Transportistas
 */
exports.validarTransportista = (req, res, next) => {
    const { razon_social, ruc } = req.body;

    if (!razon_social || razon_social.trim().length < 3) {
        return res.status(400).json({
            success: false,
            message: 'La razón social es requerida (mínimo 3 caracteres)'
        });
    }

    // El RUC debe tener 11 dígitos
    const rucRegex = /^[0-9]{11}$/;
    if (!ruc || !rucRegex.test(ruc)) {
        return res.status(400).json({
            success: false,
            message: 'El RUC debe ser un número válido de 11 dígitos'
        });
    }

    next();
};
