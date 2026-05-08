const transportistaModel = require('../Models/transportistaModel');

/**
 * Servicio para gestionar la lógica de negocio de Transportistas
 */
exports.listarTodos = async () => {
    return await transportistaModel.obtenerTodos();
};

exports.obtenerPorId = async (id) => {
    const transportista = await transportistaModel.obtenerPorId(id);
    if (!transportista) {
        throw new Error('Transportista no encontrado');
    }
    return transportista;
};

exports.crearTransportista = async (datos) => {
    // 1. Validar Razón Social única
    const existeNombre = await transportistaModel.existeRazonSocial(datos.razon_social);
    if (existeNombre) {
        throw new Error('Esa razón social ya está registrada');
    }

    // 2. Validar RUC único
    const existeRuc = await transportistaModel.existeRuc(datos.ruc);
    if (existeRuc) {
        throw new Error('El RUC ya está registrado por otro transportista');
    }

    return await transportistaModel.crear(datos);
};

exports.actualizarTransportista = async (id, datos) => {
    // 1. Validar Razón Social única (excluyendo al actual)
    const existeNombre = await transportistaModel.existeRazonSocial(datos.razon_social, id);
    if (existeNombre) {
        throw new Error('Esa razón social ya está en uso por otro transportista');
    }

    // 2. Validar RUC único (excluyendo al actual)
    const existeRuc = await transportistaModel.existeRuc(datos.ruc, id);
    if (existeRuc) {
        throw new Error('El RUC ya está en uso por otro transportista');
    }

    return await transportistaModel.actualizar(id, datos);
};

exports.eliminarTransportista = async (id) => {
    return await transportistaModel.eliminar(id);
};
