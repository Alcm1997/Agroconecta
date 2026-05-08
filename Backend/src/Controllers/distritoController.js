const distritoService = require('../Services/distritoService');
const DistritoDTO = require('../DTOs/distritoDTO');

exports.createDistrito = async (req, res) => {
    try {
        const { nombre_distrito, id_departamento } = req.body;
        const distrito = await distritoService.crear(nombre_distrito, id_departamento);
        res.status(201).json({
            success: true,
            message: 'Distrito creado correctamente',
            data: DistritoDTO.transform(distrito)
        });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.getAllDistritos = async (req, res) => {
    try {
        const distritos = await distritoService.listarTodos();
        res.json(DistritoDTO.transform(distritos));
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al obtener distritos' });
    }
};

exports.getDistritoById = async (req, res) => {
    try {
        const distrito = await distritoService.obtenerPorId(req.params.id);
        res.json(DistritoDTO.transform(distrito));
    } catch (error) {
        res.status(error.message === 'Distrito no encontrado' ? 404 : 500).json({
            success: false,
            message: error.message
        });
    }
};

exports.getDistritosByDepartamento = async (req, res) => {
    try {
        const distritos = await distritoService.listarPorDepartamento(req.params.id_departamento);
        res.json(DistritoDTO.transform(distritos));
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al obtener distritos por departamento' });
    }
};

exports.updateDistrito = async (req, res) => {
    try {
        const { nombre_distrito, id_departamento } = req.body;
        const distrito = await distritoService.actualizar(req.params.id, nombre_distrito, id_departamento);
        res.json({
            success: true,
            message: 'Distrito actualizado correctamente',
            data: DistritoDTO.transform(distrito)
        });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.deleteDistrito = async (req, res) => {
    try {
        await distritoService.eliminar(req.params.id);
        res.json({ success: true, message: 'Distrito eliminado correctamente' });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};
