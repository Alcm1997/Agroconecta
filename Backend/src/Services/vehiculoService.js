const vehiculoModel = require('../Models/vehiculoModel');

/**
 * Servicio para gestionar la lógica de negocio de Vehículos
 */
exports.listarVehiculos = async (id_transportista = null) => {
    return await vehiculoModel.obtenerTodos(id_transportista);
};

exports.obtenerVehiculo = async (id) => {
    const vehiculo = await vehiculoModel.obtenerPorId(id);
    if (!vehiculo) {
        throw new Error('Vehículo no encontrado');
    }
    return vehiculo;
};

exports.registrarVehiculo = async (datos) => {
    // Validar placa única
    const existe = await vehiculoModel.existePlaca(datos.placa);
    if (existe) {
        throw new Error(`La placa ${datos.placa.toUpperCase()} ya está registrada`);
    }
    return await vehiculoModel.crear(datos);
};

exports.actualizarVehiculo = async (id, datos) => {
    // Validar placa única (excluyendo al actual)
    const existe = await vehiculoModel.existePlaca(datos.placa, id);
    if (existe) {
        throw new Error(`La placa ${datos.placa.toUpperCase()} ya está en uso`);
    }
    return await vehiculoModel.actualizar(id, datos);
};

exports.eliminarVehiculo = async (id) => {
    return await vehiculoModel.eliminar(id);
};
