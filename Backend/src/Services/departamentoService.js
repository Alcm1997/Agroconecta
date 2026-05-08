const departamentoModel = require('../Models/departamentoModel');

/**
 * Servicio para gestionar la lógica de negocio de Departamentos
 */
exports.listarTodos = async () => {
    return await departamentoModel.getAllDepartamentos();
};

exports.obtenerPorId = async (id) => {
    const dep = await departamentoModel.getDepartamentoById(id);
    if (!dep) throw new Error('Departamento no encontrado');
    return dep;
};

exports.crear = async (nombre) => {
    // Validar duplicado
    const existe = await departamentoModel.getDepartamentoByNombre(nombre);
    if (existe) throw new Error('Este departamento ya existe');

    return await departamentoModel.createDepartamento(nombre);
};

exports.actualizar = async (id, nombre) => {
    // Validar duplicado (que no sea otro registro)
    const existe = await departamentoModel.getDepartamentoByNombre(nombre);
    if (existe && existe.id_departamento != id) {
        throw new Error('Ya existe otro departamento con ese nombre');
    }

    const updated = await departamentoModel.updateDepartamento(id, nombre);
    if (!updated) throw new Error('Departamento no encontrado');
    return updated;
};

exports.eliminar = async (id) => {
    const result = await departamentoModel.deleteDepartamento(id);
    if (!result) throw new Error('Departamento no encontrado o no se pudo eliminar');
    return result;
};
