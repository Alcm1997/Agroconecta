const carritoService = require('../Services/carritoService');
const CarritoDTO = require('../DTOs/carritoDTO');

// Obtener carrito del cliente autenticado
exports.obtener = async (req, res) => {
    try {
        const id_cliente = req.user.id_cliente;
        const items = await carritoService.obtenerCarrito(id_cliente);
        res.json({
            success: true,
            data: CarritoDTO.transform(items)
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al obtener el carrito' });
    }
};

// Agregar item al carrito
exports.agregar = async (req, res) => {
    try {
        const id_cliente = req.user.id_cliente;
        const item = await carritoService.agregarOActualizar(id_cliente, req.body);
        res.status(201).json({
            success: true,
            message: 'Producto añadido al carrito',
            data: item
        });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// Actualizar cantidad de un item
exports.actualizar = async (req, res) => {
    try {
        const id_cliente = req.user.id_cliente;
        const item = await carritoService.actualizarCantidad(req.params.id, id_cliente, req.body.cantidad);
        res.json({
            success: true,
            message: 'Cantidad actualizada correctamente',
            data: item
        });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// Eliminar un item del carrito
exports.eliminar = async (req, res) => {
    try {
        const id_cliente = req.user.id_cliente;
        await carritoService.eliminarItem(req.params.id, id_cliente);
        res.json({ success: true, message: 'Producto eliminado del carrito' });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// Vaciar todo el carrito
exports.vaciar = async (req, res) => {
    try {
        const id_cliente = req.user.id_cliente;
        await carritoService.vaciar(id_cliente);
        res.json({ success: true, message: 'Carrito vaciado correctamente' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al vaciar el carrito' });
    }
};

// Sincronizar carrito desde localStorage (al login)
exports.sincronizar = async (req, res) => {
    try {
        const id_cliente = req.user.id_cliente;
        const carritoActualizado = await carritoService.sincronizar(id_cliente, req.body.items);
        res.json({
            success: true,
            message: 'Carrito sincronizado correctamente',
            data: CarritoDTO.transform(carritoActualizado)
        });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};
