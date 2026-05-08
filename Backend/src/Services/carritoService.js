const carritoModel = require('../Models/carritoModel');
const productoModel = require('../Models/productoModel');

/**
 * Servicio para gestionar la lógica de negocio del Carrito
 */
exports.obtenerCarrito = async (id_cliente) => {
    return await carritoModel.obtenerCarrito(id_cliente);
};

exports.agregarOActualizar = async (id_cliente, datos) => {
    const { id_producto, cantidad, opciones = [] } = datos;

    // 1. Validar Stock Real
    const producto = await productoModel.getProductoById(id_producto);
    if (!producto) throw new Error('Producto no encontrado');
    if (producto.stock < cantidad) {
        throw new Error(`Stock insuficiente. Solo quedan ${producto.stock} unidades.`);
    }

    // 2. Verificar si ya existe en el carrito
    const itemExistente = await carritoModel.obtenerItemEspecifico(id_cliente, id_producto, opciones);

    if (itemExistente) {
        // 3. Si existe, sumar cantidad (validando stock total)
        const nuevaCantidad = itemExistente.cantidad + cantidad;
        if (producto.stock < nuevaCantidad) {
            throw new Error(`No puedes añadir más. Stock máximo alcanzado (${producto.stock}).`);
        }
        return await carritoModel.actualizarCantidad(itemExistente.id_carrito, id_cliente, nuevaCantidad);
    } else {
        // 4. Si no existe, crear nuevo
        return await carritoModel.agregarItem(id_cliente, id_producto, cantidad, opciones);
    }
};

exports.actualizarCantidad = async (id_carrito, id_cliente, cantidad) => {
    if (cantidad <= 0) {
        return await carritoModel.eliminarItem(id_carrito, id_cliente);
    }
    return await carritoModel.actualizarCantidad(id_carrito, id_cliente, cantidad);
};

exports.eliminarItem = async (id_carrito, id_cliente) => {
    return await carritoModel.eliminarItem(id_carrito, id_cliente);
};

exports.vaciar = async (id_cliente) => {
    return await carritoModel.vaciarCarrito(id_cliente);
};

/**
 * Sincroniza items del localStorage al login
 * Lógica: Si el item local ya existe en DB, actualiza cantidad.
 * Al final devuelve el carrito completo unificado.
 */
exports.sincronizar = async (id_cliente, itemsLocal = []) => {
    if (Array.isArray(itemsLocal) && itemsLocal.length > 0) {
        for (const item of itemsLocal) {
            try {
                await this.agregarOActualizar(id_cliente, item);
            } catch (e) {
                console.warn(`No se pudo sincronizar item ${item.id_producto}: ${e.message}`);
            }
        }
    }
    // Devolvemos la verdad absoluta de la Base de Datos
    return await this.obtenerCarrito(id_cliente);
};
