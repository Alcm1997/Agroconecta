const vehiculoService = require('../Services/vehiculoService');
const VehiculoDTO = require('../DTOs/vehiculoDTO');

exports.listarVehiculos = async (req, res) => {
    try {
        const { id_transportista } = req.query;
        const vehiculos = await vehiculoService.listarVehiculos(id_transportista);
        res.json({
            success: true,
            vehiculos: VehiculoDTO.transform(vehiculos)
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.obtenerVehiculo = async (req, res) => {
    try {
        const vehiculo = await vehiculoService.obtenerVehiculo(req.params.id);
        res.json({
            success: true,
            vehiculo: VehiculoDTO.transform(vehiculo)
        });
    } catch (error) {
        res.status(error.message === 'Vehículo no encontrado' ? 404 : 500).json({
            success: false,
            message: error.message
        });
    }
};

exports.crearVehiculo = async (req, res) => {
    try {
        const vehiculo = await vehiculoService.registrarVehiculo(req.body);
        res.status(201).json({
            success: true,
            message: 'Vehículo registrado exitosamente',
            vehiculo: VehiculoDTO.transform(vehiculo)
        });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.actualizarVehiculo = async (req, res) => {
    try {
        const vehiculo = await vehiculoService.actualizarVehiculo(req.params.id, req.body);
        res.json({
            success: true,
            message: 'Vehículo actualizado exitosamente',
            vehiculo: VehiculoDTO.transform(vehiculo)
        });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.eliminarVehiculo = async (req, res) => {
    try {
        await vehiculoService.eliminarVehiculo(req.params.id);
        res.json({ success: true, message: 'Vehículo eliminado exitosamente' });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};
