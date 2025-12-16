const carritoModel = require('../Models/carritoModel');

// Obtener carrito del cliente autenticado
exports.obtener = async (req, res) => {
    try {
        const id_cliente = req.user?.id_cliente;

        if (!id_cliente) {
            return res.status(401).json({
                success: false,
                message: 'No autenticado'
            });
        }

        const items = await carritoModel.obtenerCarrito(id_cliente);

        res.json({
            success: true,
            items
        });

    } catch (error) {
        console.error('Error al obtener carrito:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener el carrito',
            error: error.message
        });
    }
};

// Agregar item al carrito
exports.agregar = async (req, res) => {
    try {
        const id_cliente = req.user?.id_cliente;
        const { id_producto, cantidad, opciones } = req.body;

        if (!id_cliente) {
            return res.status(401).json({
                success: false,
                message: 'No autenticado'
            });
        }

        if (!id_producto || !cantidad) {
            return res.status(400).json({
                success: false,
                message: 'id_producto y cantidad son requeridos'
            });
        }

        const item = await carritoModel.agregarItem(
            id_cliente,
            id_producto,
            parseInt(cantidad),
            opciones || []
        );

        res.status(201).json({
            success: true,
            message: 'Producto agregado al carrito',
            item
        });

    } catch (error) {
        console.error('Error al agregar al carrito:', error);
        res.status(500).json({
            success: false,
            message: 'Error al agregar al carrito',
            error: error.message
        });
    }
};

// Actualizar cantidad de un item
exports.actualizar = async (req, res) => {
    try {
        const id_cliente = req.user?.id_cliente;
        const { id } = req.params;
        const { cantidad } = req.body;

        if (!id_cliente) {
            return res.status(401).json({
                success: false,
                message: 'No autenticado'
            });
        }

        if (!cantidad || isNaN(cantidad)) {
            return res.status(400).json({
                success: false,
                message: 'Cantidad inválida'
            });
        }

        const item = await carritoModel.actualizarCantidad(
            parseInt(id),
            id_cliente,
            parseInt(cantidad)
        );

        if (!item) {
            return res.status(404).json({
                success: false,
                message: 'Item no encontrado en el carrito'
            });
        }

        res.json({
            success: true,
            message: 'Cantidad actualizada',
            item
        });

    } catch (error) {
        console.error('Error al actualizar carrito:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar el carrito',
            error: error.message
        });
    }
};

// Eliminar un item del carrito
exports.eliminar = async (req, res) => {
    try {
        const id_cliente = req.user?.id_cliente;
        const { id } = req.params;

        if (!id_cliente) {
            return res.status(401).json({
                success: false,
                message: 'No autenticado'
            });
        }

        const item = await carritoModel.eliminarItem(parseInt(id), id_cliente);

        if (!item) {
            return res.status(404).json({
                success: false,
                message: 'Item no encontrado en el carrito'
            });
        }

        res.json({
            success: true,
            message: 'Producto eliminado del carrito'
        });

    } catch (error) {
        console.error('Error al eliminar del carrito:', error);
        res.status(500).json({
            success: false,
            message: 'Error al eliminar del carrito',
            error: error.message
        });
    }
};

// Vaciar todo el carrito
exports.vaciar = async (req, res) => {
    try {
        const id_cliente = req.user?.id_cliente;

        if (!id_cliente) {
            return res.status(401).json({
                success: false,
                message: 'No autenticado'
            });
        }

        await carritoModel.vaciarCarrito(id_cliente);

        res.json({
            success: true,
            message: 'Carrito vaciado correctamente'
        });

    } catch (error) {
        console.error('Error al vaciar carrito:', error);
        res.status(500).json({
            success: false,
            message: 'Error al vaciar el carrito',
            error: error.message
        });
    }
};

// Sincronizar carrito desde localStorage (al login)
exports.sincronizar = async (req, res) => {
    try {
        const id_cliente = req.user?.id_cliente;
        const { items } = req.body;

        if (!id_cliente) {
            return res.status(401).json({
                success: false,
                message: 'No autenticado'
            });
        }

        const carritoActualizado = await carritoModel.sincronizarCarrito(
            id_cliente,
            items || []
        );

        res.json({
            success: true,
            message: 'Carrito sincronizado',
            items: carritoActualizado
        });

    } catch (error) {
        console.error('Error al sincronizar carrito:', error);
        res.status(500).json({
            success: false,
            message: 'Error al sincronizar el carrito',
            error: error.message
        });
    }
};
