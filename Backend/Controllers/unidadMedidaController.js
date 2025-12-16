const unidadMedidaModel = require('../Models/unidadMedidaModel');

// Obtener todas las unidades de medida
exports.getAllUnidades = async (req, res) => {
  try {
    const unidades = await unidadMedidaModel.getAllUnidades();
    res.json(unidades);
  } catch (error) {
    console.error('Error al obtener unidades de medida:', error);
    res.status(500).json({ message: 'Error al obtener unidades de medida' });
  }
};

// Obtener unidad de medida por ID
exports.getUnidadById = async (req, res) => {
  try {
    const unidad = await unidadMedidaModel.getUnidadById(req.params.id);
    if (!unidad) {
      return res.status(404).json({ message: 'Unidad de medida no encontrada' });
    }
    res.json(unidad);
  } catch (error) {
    console.error('Error al obtener unidad de medida:', error);
    res.status(500).json({ message: 'Error al obtener unidad de medida' });
  }
};

// Crear unidad de medida
exports.createUnidad = async (req, res) => {
  try {
    const { descripcion } = req.body;
    
    if (!descripcion || descripcion.trim() === '') {
      return res.status(400).json({ message: 'La descripción es requerida' });
    }
    
    const unidad = await unidadMedidaModel.createUnidad(descripcion.trim());
    res.status(201).json({ message: 'Unidad de medida creada exitosamente', unidad });
  } catch (error) {
    console.error('Error al crear unidad de medida:', error);
    if (error.code === '23505') { // Duplicate key
      res.status(400).json({ message: 'Ya existe una unidad de medida con esa descripción' });
    } else {
      res.status(500).json({ message: 'Error al crear unidad de medida' });
    }
  }
};

// Actualizar unidad de medida
exports.updateUnidad = async (req, res) => {
  try {
    const { descripcion } = req.body;
    
    if (!descripcion || descripcion.trim() === '') {
      return res.status(400).json({ message: 'La descripción es requerida' });
    }
    
    const unidad = await unidadMedidaModel.updateUnidad(req.params.id, descripcion.trim());
    if (!unidad) {
      return res.status(404).json({ message: 'Unidad de medida no encontrada' });
    }
    
    res.json({ message: 'Unidad de medida actualizada exitosamente', unidad });
  } catch (error) {
    console.error('Error al actualizar unidad de medida:', error);
    if (error.code === '23505') {
      res.status(400).json({ message: 'Ya existe una unidad de medida con esa descripción' });
    } else {
      res.status(500).json({ message: 'Error al actualizar unidad de medida' });
    }
  }
};

// Eliminar unidad de medida
exports.deleteUnidad = async (req, res) => {
  try {
    const unidad = await unidadMedidaModel.deleteUnidad(req.params.id);
    if (!unidad) {
      return res.status(404).json({ message: 'Unidad de medida no encontrada' });
    }
    
    res.json({ message: 'Unidad de medida eliminada exitosamente' });
  } catch (error) {
    console.error('Error al eliminar unidad de medida:', error);
    res.status(400).json({ message: error.message || 'Error al eliminar unidad de medida' });
  }
};