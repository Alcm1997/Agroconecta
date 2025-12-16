const categoriaModel = require('../Models/categoriaModel');

// Obtener todas las categorías
exports.getAllCategorias = async (req, res) => {
  try {
    const categorias = await categoriaModel.getAllCategorias();
    res.json(categorias);
  } catch (error) {
    console.error('Error al obtener categorías:', error);
    res.status(500).json({ message: 'Error al obtener categorías' });
  }
};

// Obtener categoría por ID
exports.getCategoriaById = async (req, res) => {
  try {
    const categoria = await categoriaModel.getCategoriaById(req.params.id);
    if (!categoria) {
      return res.status(404).json({ message: 'Categoría no encontrada' });
    }
    res.json(categoria);
  } catch (error) {
    console.error('Error al obtener categoría:', error);
    res.status(500).json({ message: 'Error al obtener categoría' });
  }
};

// Crear categoría
exports.createCategoria = async (req, res) => {
  try {
    const { descripcion } = req.body;
    
    if (!descripcion || descripcion.trim() === '') {
      return res.status(400).json({ message: 'La descripción es requerida' });
    }
    
    const categoria = await categoriaModel.createCategoria(descripcion.trim());
    res.status(201).json({ message: 'Categoría creada exitosamente', categoria });
  } catch (error) {
    console.error('Error al crear categoría:', error);
    if (error.code === '23505') { // Duplicate key
      res.status(400).json({ message: 'Ya existe una categoría con esa descripción' });
    } else {
      res.status(500).json({ message: 'Error al crear categoría' });
    }
  }
};

// Actualizar categoría
exports.updateCategoria = async (req, res) => {
  try {
    const { descripcion } = req.body;
    
    if (!descripcion || descripcion.trim() === '') {
      return res.status(400).json({ message: 'La descripción es requerida' });
    }
    
    const categoria = await categoriaModel.updateCategoria(req.params.id, descripcion.trim());
    if (!categoria) {
      return res.status(404).json({ message: 'Categoría no encontrada' });
    }
    
    res.json({ message: 'Categoría actualizada exitosamente', categoria });
  } catch (error) {
    console.error('Error al actualizar categoría:', error);
    if (error.code === '23505') {
      res.status(400).json({ message: 'Ya existe una categoría con esa descripción' });
    } else {
      res.status(500).json({ message: 'Error al actualizar categoría' });
    }
  }
};

// Eliminar categoría
exports.deleteCategoria = async (req, res) => {
  try {
    const categoria = await categoriaModel.deleteCategoria(req.params.id);
    if (!categoria) {
      return res.status(404).json({ message: 'Categoría no encontrada' });
    }
    
    res.json({ message: 'Categoría eliminada exitosamente' });
  } catch (error) {
    console.error('Error al eliminar categoría:', error);
    res.status(400).json({ message: error.message || 'Error al eliminar categoría' });
  }
};