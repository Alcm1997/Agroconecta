const unidadMedidaService = require('../Services/unidadMedidaService');
const UnidadMedidaDTO = require('../DTOs/unidadMedidaDTO');

// Obtener todas las unidades de medida
exports.getAllUnidades = async (req, res) => {
    try {
        const unidades = await unidadMedidaService.listarTodas();
        res.json(UnidadMedidaDTO.transform(unidades));
    } catch (error) {
        console.error('❌ Error en getAllUnidades:', error);
        res.status(500).json({ success: false, message: 'Error al obtener unidades de medida' });
    }
};

// Obtener unidad por ID
exports.getUnidadById = async (req, res) => {
    try {
        const unidad = await unidadMedidaService.obtenerPorId(req.params.id);
        res.json(UnidadMedidaDTO.transform(unidad));
    } catch (error) {
        res.status(error.message === 'Unidad de medida no encontrada' ? 404 : 500).json({
            success: false,
            message: error.message
        });
    }
};

// Crear unidad de medida
exports.createUnidad = async (req, res) => {
    try {
        const unidad = await unidadMedidaService.crearUnidad(req.body.descripcion);
        res.status(201).json({
            success: true,
            message: 'Unidad de medida creada exitosamente',
            unidad: UnidadMedidaDTO.transform(unidad)
        });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// Actualizar unidad de medida
exports.updateUnidad = async (req, res) => {
    try {
        const unidad = await unidadMedidaService.actualizarUnidad(req.params.id, req.body.descripcion);
        res.json({
            success: true,
            message: 'Unidad de medida actualizada exitosamente',
            unidad: UnidadMedidaDTO.transform(unidad)
        });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// Eliminar unidad de medida
exports.deleteUnidad = async (req, res) => {
    try {
        await unidadMedidaService.eliminarUnidad(req.params.id);
        res.json({
            success: true,
            message: 'Unidad de medida eliminada exitosamente'
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};
