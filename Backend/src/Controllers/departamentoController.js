const departamentoService = require('../Services/departamentoService');
const DepartamentoDTO = require('../DTOs/departamentoDTO');

exports.createDepartamento = async (req, res) => {
    try {
        const departamento = await departamentoService.crear(req.body.nombre_departamento);
        res.status(201).json({
            success: true,
            message: 'Departamento creado correctamente',
            data: DepartamentoDTO.transform(departamento)
        });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.getAllDepartamentos = async (req, res) => {
    try {
        const departamentos = await departamentoService.listarTodos();
        res.json(DepartamentoDTO.transform(departamentos));
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al obtener departamentos' });
    }
};

exports.getDepartamentoById = async (req, res) => {
    try {
        const departamento = await departamentoService.obtenerPorId(req.params.id);
        res.json(DepartamentoDTO.transform(departamento));
    } catch (error) {
        res.status(error.message === 'Departamento no encontrado' ? 404 : 500).json({
            success: false,
            message: error.message
        });
    }
};

exports.updateDepartamento = async (req, res) => {
    try {
        const departamento = await departamentoService.actualizar(req.params.id, req.body.nombre_departamento);
        res.json({
            success: true,
            message: 'Departamento actualizado correctamente',
            data: DepartamentoDTO.transform(departamento)
        });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.deleteDepartamento = async (req, res) => {
    try {
        await departamentoService.eliminar(req.params.id);
        res.json({ success: true, message: 'Departamento eliminado correctamente' });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};
