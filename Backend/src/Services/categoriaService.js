const categoriaModel = require('../Models/categoriaModel');

/**
 * Servicio para gestionar la lógica de negocio de Categorías
 */
exports.listarTodas = async () => {
    return await categoriaModel.getAllCategorias();
};

exports.obtenerPorId = async (id) => {
    const categoria = await categoriaModel.getCategoriaById(id);
    if (!categoria) {
        throw new Error('Categoría no encontrada');
    }
    return categoria;
};

exports.crearCategoria = async (descripcion) => {
    // Validación preventiva: ¿Ya existe?
    const existe = await categoriaModel.getByDescripcion(descripcion);
    if (existe) {
        throw new Error('Ya existe una categoría con esa descripción');
    }

    return await categoriaModel.createCategoria(descripcion.trim());
};

exports.actualizarCategoria = async (id, descripcion) => {
    // Validación preventiva: ¿Ya existe en OTRO registro?
    const existe = await categoriaModel.getByDescripcion(descripcion);
    if (existe && existe.id_categoria != id) {
        throw new Error('Ya existe otra categoría con esa descripción');
    }

    const categoria = await categoriaModel.updateCategoria(id, descripcion.trim());
    if (!categoria) {
        throw new Error('Categoría no encontrada');
    }
    return categoria;
};

exports.eliminarCategoria = async (id) => {
    const categoria = await categoriaModel.deleteCategoria(id);
    if (!categoria) {
        throw new Error('Categoría no encontrada');
    }
    return categoria;
};
