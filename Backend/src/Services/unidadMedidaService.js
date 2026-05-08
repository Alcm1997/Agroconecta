const unidadMedidaModel = require('../Models/unidadMedidaModel');

/**
 * Servicio para gestionar la lógica de negocio de Unidades de Medida
 */
exports.listarTodas = async () => {
    return await unidadMedidaModel.getAllUnidades();
};

exports.obtenerPorId = async (id) => {
    const unidad = await unidadMedidaModel.getUnidadById(id);
    if (!unidad) {
        throw new Error('Unidad de medida no encontrada');
    }
    return unidad;
};

exports.crearUnidad = async (descripcion) => {
    // Validación proactiva
    const existe = await unidadMedidaModel.getByDescripcion(descripcion);
    if (existe) {
        throw new Error('Ya existe una unidad de medida con esa descripción');
    }

    return await unidadMedidaModel.createUnidad(descripcion.trim());
};

exports.actualizarUnidad = async (id, descripcion) => {
    // Validación proactiva (excluyendo la actual)
    const existe = await unidadMedidaModel.getByDescripcion(descripcion);
    if (existe && existe.id_unidad != id) {
        throw new Error('Ya existe otra unidad de medida con esa descripción');
    }

    const unidad = await unidadMedidaModel.updateUnidad(id, descripcion.trim());
    if (!unidad) {
        throw new Error('Unidad de medida no encontrada');
    }
    return unidad;
};

exports.eliminarUnidad = async (id) => {
    const unidad = await unidadMedidaModel.deleteUnidad(id);
    if (!unidad) {
        throw new Error('Unidad de medida no encontrada');
    }
    return unidad;
};
