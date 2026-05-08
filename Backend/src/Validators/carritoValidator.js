/**
 * Validador para el Carrito de Compras
 */
exports.validarItemCarrito = (req, res, next) => {
    const { id_producto, cantidad } = req.body;

    if (!id_producto) {
        return res.status(400).json({ success: false, message: 'El ID del producto es obligatorio.' });
    }

    if (cantidad === undefined || cantidad <= 0) {
        return res.status(400).json({ success: false, message: 'La cantidad debe ser un número mayor a cero.' });
    }

    next();
};

exports.validarActualizacionCantidad = (req, res, next) => {
    const { cantidad } = req.body;

    if (cantidad === undefined || cantidad < 0) {
        return res.status(400).json({ success: false, message: 'La cantidad no puede ser negativa.' });
    }

    next();
};
