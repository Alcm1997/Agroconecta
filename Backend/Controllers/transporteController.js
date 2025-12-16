const transporteModel = require('../Models/transporteModel');

// ========== TRANSPORTISTAS ==========

// Listar todos los transportistas
exports.listarTransportistas = async (req, res) => {
    try {
        const transportistas = await transporteModel.obtenerTodos();
        res.json({
            success: true,
            transportistas
        });
    } catch (error) {
        console.error('Error al listar transportistas:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener los transportistas'
        });
    }
};

// Obtener transportista por ID
exports.obtenerTransportista = async (req, res) => {
    try {
        const { id } = req.params;
        const transportista = await transporteModel.obtenerPorId(id);

        if (!transportista) {
            return res.status(404).json({
                success: false,
                message: 'Transportista no encontrado'
            });
        }

        res.json({
            success: true,
            transportista
        });
    } catch (error) {
        console.error('Error al obtener transportista:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener el transportista'
        });
    }
};

// Crear transportista
exports.crearTransportista = async (req, res) => {
    try {
        const { razon_social, ruc } = req.body;

        // Validaciones
        if (!razon_social || razon_social.trim().length < 3) {
            return res.status(400).json({
                success: false,
                message: 'La razón social es requerida (mínimo 3 caracteres)'
            });
        }

        if (!ruc || !/^\d{11}$/.test(ruc)) {
            return res.status(400).json({
                success: false,
                message: 'El RUC debe tener 11 dígitos'
            });
        }

        // Verificar RUC único
        if (await transporteModel.existeRuc(ruc)) {
            return res.status(400).json({
                success: false,
                message: 'El RUC ya está registrado'
            });
        }

        const transportista = await transporteModel.crear({
            razon_social: razon_social.trim(),
            ruc
        });

        res.status(201).json({
            success: true,
            message: 'Transportista creado exitosamente',
            transportista
        });
    } catch (error) {
        console.error('Error al crear transportista:', error);
        res.status(500).json({
            success: false,
            message: 'Error al crear el transportista'
        });
    }
};

// Actualizar transportista
exports.actualizarTransportista = async (req, res) => {
    try {
        const { id } = req.params;
        const { razon_social, ruc } = req.body;

        // Validaciones
        if (!razon_social || razon_social.trim().length < 3) {
            return res.status(400).json({
                success: false,
                message: 'La razón social es requerida (mínimo 3 caracteres)'
            });
        }

        if (!ruc || !/^\d{11}$/.test(ruc)) {
            return res.status(400).json({
                success: false,
                message: 'El RUC debe tener 11 dígitos'
            });
        }

        // Verificar RUC único (excluyendo el actual)
        if (await transporteModel.existeRuc(ruc, id)) {
            return res.status(400).json({
                success: false,
                message: 'El RUC ya está registrado por otro transportista'
            });
        }

        const transportista = await transporteModel.actualizar(id, {
            razon_social: razon_social.trim(),
            ruc
        });

        if (!transportista) {
            return res.status(404).json({
                success: false,
                message: 'Transportista no encontrado'
            });
        }

        res.json({
            success: true,
            message: 'Transportista actualizado exitosamente',
            transportista
        });
    } catch (error) {
        console.error('Error al actualizar transportista:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar el transportista'
        });
    }
};

// Eliminar transportista
exports.eliminarTransportista = async (req, res) => {
    try {
        const { id } = req.params;
        const transportista = await transporteModel.eliminar(id);

        if (!transportista) {
            return res.status(404).json({
                success: false,
                message: 'Transportista no encontrado'
            });
        }

        res.json({
            success: true,
            message: 'Transportista eliminado exitosamente'
        });
    } catch (error) {
        console.error('Error al eliminar transportista:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error al eliminar el transportista'
        });
    }
};

// ========== VEHÍCULOS ==========

// Listar vehículos
exports.listarVehiculos = async (req, res) => {
    try {
        const { id_transportista } = req.query;
        const vehiculos = await transporteModel.obtenerVehiculos(id_transportista);
        res.json({
            success: true,
            vehiculos
        });
    } catch (error) {
        console.error('Error al listar vehículos:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener los vehículos'
        });
    }
};

// Obtener vehículo por ID
exports.obtenerVehiculo = async (req, res) => {
    try {
        const { id } = req.params;
        const vehiculo = await transporteModel.obtenerVehiculoPorId(id);

        if (!vehiculo) {
            return res.status(404).json({
                success: false,
                message: 'Vehículo no encontrado'
            });
        }

        res.json({
            success: true,
            vehiculo
        });
    } catch (error) {
        console.error('Error al obtener vehículo:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener el vehículo'
        });
    }
};

// Crear vehículo
exports.crearVehiculo = async (req, res) => {
    try {
        const { id_transportista, placa } = req.body;

        // Validaciones
        if (!id_transportista) {
            return res.status(400).json({
                success: false,
                message: 'El transportista es requerido'
            });
        }

        if (!placa || placa.trim().length < 5) {
            return res.status(400).json({
                success: false,
                message: 'La placa es requerida (mínimo 5 caracteres)'
            });
        }

        // Verificar placa única
        if (await transporteModel.existePlaca(placa)) {
            return res.status(400).json({
                success: false,
                message: 'La placa ya está registrada'
            });
        }

        const vehiculo = await transporteModel.crearVehiculo({
            id_transportista,
            placa: placa.trim()
        });

        res.status(201).json({
            success: true,
            message: 'Vehículo creado exitosamente',
            vehiculo
        });
    } catch (error) {
        console.error('Error al crear vehículo:', error);
        res.status(500).json({
            success: false,
            message: 'Error al crear el vehículo'
        });
    }
};

// Actualizar vehículo
exports.actualizarVehiculo = async (req, res) => {
    try {
        const { id } = req.params;
        const { id_transportista, placa } = req.body;

        // Validaciones
        if (!id_transportista) {
            return res.status(400).json({
                success: false,
                message: 'El transportista es requerido'
            });
        }

        if (!placa || placa.trim().length < 5) {
            return res.status(400).json({
                success: false,
                message: 'La placa es requerida (mínimo 5 caracteres)'
            });
        }

        // Verificar placa única (excluyendo el actual)
        if (await transporteModel.existePlaca(placa, id)) {
            return res.status(400).json({
                success: false,
                message: 'La placa ya está registrada'
            });
        }

        const vehiculo = await transporteModel.actualizarVehiculo(id, {
            id_transportista,
            placa: placa.trim()
        });

        if (!vehiculo) {
            return res.status(404).json({
                success: false,
                message: 'Vehículo no encontrado'
            });
        }

        res.json({
            success: true,
            message: 'Vehículo actualizado exitosamente',
            vehiculo
        });
    } catch (error) {
        console.error('Error al actualizar vehículo:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar el vehículo'
        });
    }
};

// Eliminar vehículo
exports.eliminarVehiculo = async (req, res) => {
    try {
        const { id } = req.params;
        const vehiculo = await transporteModel.eliminarVehiculo(id);

        if (!vehiculo) {
            return res.status(404).json({
                success: false,
                message: 'Vehículo no encontrado'
            });
        }

        res.json({
            success: true,
            message: 'Vehículo eliminado exitosamente'
        });
    } catch (error) {
        console.error('Error al eliminar vehículo:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error al eliminar el vehículo'
        });
    }
};
