const transportistaService = require('../Services/transportistaService');
const TransportistaDTO = require('../DTOs/transportistaDTO');

exports.listarTransportistas = async (req, res) => {
    try {
        const transportistas = await transportistaService.listarTodos();
        res.json({
            success: true,
            transportistas: TransportistaDTO.transform(transportistas)
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.obtenerTransportista = async (req, res) => {
    try {
        const transportista = await transportistaService.obtenerPorId(req.params.id);
        res.json({
            success: true,
            transportista: TransportistaDTO.transform(transportista)
        });
    } catch (error) {
        res.status(error.message === 'Transportista no encontrado' ? 404 : 500).json({
            success: false,
            message: error.message
        });
    }
};

exports.crearTransportista = async (req, res) => {
    try {
        const transportista = await transportistaService.crearTransportista(req.body);
        res.status(201).json({
            success: true,
            message: 'Transportista creado exitosamente',
            transportista: TransportistaDTO.transform(transportista)
        });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.actualizarTransportista = async (req, res) => {
    try {
        const transportista = await transportistaService.actualizarTransportista(req.params.id, req.body);
        res.json({
            success: true,
            message: 'Transportista actualizado exitosamente',
            transportista: TransportistaDTO.transform(transportista)
        });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.eliminarTransportista = async (req, res) => {
    try {
        await transportistaService.eliminarTransportista(req.params.id);
        res.json({ success: true, message: 'Transportista eliminado exitosamente' });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};
