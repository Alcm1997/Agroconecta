const distritoModel = require('../Models/distritoModel');

/**
 * Servicio para gestionar la lógica de negocio de Distritos
 */
exports.listarTodos = async () => {
    return await distritoModel.getAllDistritos();
};

exports.listarPorDepartamento = async (id_departamento) => {
    return await distritoModel.getDistritosByDepartamento(id_departamento);
};

exports.obtenerPorId = async (id) => {
    const dist = await distritoModel.getDistritoById(id);
    if (!dist) throw new Error('Distrito no encontrado');
    return dist;
};

exports.crear = async (nombre, id_departamento) => {
    // Validar duplicado en el mismo departamento
    const existe = await distritoModel.getDistritoByNombre(nombre, id_departamento);
    if (existe) throw new Error('Este distrito ya existe en este departamento');

    return await distritoModel.createDistrito(nombre, id_departamento);
};

exports.actualizar = async (id, nombre, id_departamento) => {
    // Validar duplicado (que no sea otro registro en el mismo departamento)
    const existe = await distritoModel.getDistritoByNombre(nombre, id_departamento);
    if (existe && existe.id_distrito != id) {
        throw new Error('Ya existe otro distrito con ese nombre en este departamento');
    }

    const updated = await distritoModel.updateDistrito(id, nombre, id_departamento);
    if (!updated) throw new Error('Distrito no encontrado');
    return updated;
};

exports.eliminar = async (id) => {
    const result = await distritoModel.deleteDistrito(id);
    if (!result) throw new Error('Distrito no encontrado o no se pudo eliminar');
    return result;
};
