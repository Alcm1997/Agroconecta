const categoriaService = require('../Services/categoriaService');
const CategoriaDTO = require('../DTOs/categoriaDTO');

// Obtener todas las categorías
exports.getAllCategorias = async (req, res) => {
    try {
        const categorias = await categoriaService.listarTodas();
        res.json(CategoriaDTO.transform(categorias));
    } catch (error) {
        console.error('❌ Error en getAllCategorias:', error);
        res.status(500).json({ success: false, message: 'Error al obtener categorías' });
    }
};

// Obtener categoría por ID
exports.getCategoriaById = async (req, res) => {
    try {
        const categoria = await categoriaService.obtenerPorId(req.params.id);
        res.json(CategoriaDTO.transform(categoria));
    } catch (error) {
        res.status(error.message === 'Categoría no encontrada' ? 404 : 500).json({
            success: false,
            message: error.message
        });
    }
};

// Crear categoría
exports.createCategoria = async (req, res) => {
    try {
        const categoria = await categoriaService.crearCategoria(req.body.descripcion);
        res.status(201).json({
            success: true,
            message: 'Categoría creada exitosamente',
            categoria: CategoriaDTO.transform(categoria)
        });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// Actualizar categoría
exports.updateCategoria = async (req, res) => {
    try {
        const categoria = await categoriaService.actualizarCategoria(req.params.id, req.body.descripcion);
        res.json({
            success: true,
            message: 'Categoría actualizada exitosamente',
            categoria: CategoriaDTO.transform(categoria)
        });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// Eliminar categoría
exports.deleteCategoria = async (req, res) => {
    try {
        await categoriaService.eliminarCategoria(req.params.id);
        res.json({
            success: true,
            message: 'Categoría eliminada exitosamente'
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};
