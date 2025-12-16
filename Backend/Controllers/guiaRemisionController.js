const guiaModel = require('../Models/guiaRemisionModel');
const transporteModel = require('../Models/transporteModel');

// Listar todas las guías de remisión
exports.listarGuias = async (req, res) => {
    try {
        const guias = await guiaModel.obtenerTodas();
        res.json({
            success: true,
            guias
        });
    } catch (error) {
        console.error('Error al listar guías:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener las guías de remisión'
        });
    }
};

// Obtener guía por ID
exports.obtenerGuia = async (req, res) => {
    try {
        const { id } = req.params;
        const guia = await guiaModel.obtenerPorId(id);

        if (!guia) {
            return res.status(404).json({
                success: false,
                message: 'Guía de remisión no encontrada'
            });
        }

        res.json({
            success: true,
            guia
        });
    } catch (error) {
        console.error('Error al obtener guía:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener la guía de remisión'
        });
    }
};

// Obtener guía por pedido
exports.obtenerGuiaPorPedido = async (req, res) => {
    try {
        const { id_pedido } = req.params;
        const guia = await guiaModel.obtenerPorPedido(id_pedido);

        res.json({
            success: true,
            guia: guia || null,
            tieneGuia: !!guia
        });
    } catch (error) {
        console.error('Error al obtener guía por pedido:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener la guía del pedido'
        });
    }
};

// Obtener datos para crear guía (transportistas, vehículos, datos del pedido)
exports.obtenerDatosCreacion = async (req, res) => {
    try {
        const { id_pedido } = req.params;

        // Verificar si ya existe guía para este pedido
        const existeGuia = await guiaModel.existeGuiaPorPedido(id_pedido);
        if (existeGuia) {
            return res.status(400).json({
                success: false,
                message: 'Este pedido ya tiene una guía de remisión asociada'
            });
        }

        // Obtener datos del pedido
        const pedido = await guiaModel.obtenerDatosPedidoParaGuia(id_pedido);
        if (!pedido) {
            return res.status(404).json({
                success: false,
                message: 'Pedido no encontrado'
            });
        }

        // Obtener transportistas y vehículos
        const transportistas = await transporteModel.obtenerTodos();
        const vehiculos = await transporteModel.obtenerVehiculos();

        res.json({
            success: true,
            pedido,
            transportistas,
            vehiculos
        });
    } catch (error) {
        console.error('Error al obtener datos para guía:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener los datos para crear la guía'
        });
    }
};

// Crear guía de remisión
exports.crearGuia = async (req, res) => {
    try {
        const { id_pedido, id_transportista, id_vehiculo, punto_partida, punto_llegada, id_distrito, id_departamento } = req.body;

        // Validaciones
        if (!id_pedido) {
            return res.status(400).json({
                success: false,
                message: 'El ID del pedido es requerido'
            });
        }

        if (!id_transportista) {
            return res.status(400).json({
                success: false,
                message: 'Debe seleccionar un transportista'
            });
        }

        if (!id_vehiculo) {
            return res.status(400).json({
                success: false,
                message: 'Debe seleccionar un vehículo'
            });
        }

        if (!punto_partida || punto_partida.trim().length < 5) {
            return res.status(400).json({
                success: false,
                message: 'El punto de partida es requerido (mínimo 5 caracteres)'
            });
        }

        if (!punto_llegada || punto_llegada.trim().length < 5) {
            return res.status(400).json({
                success: false,
                message: 'El punto de llegada es requerido (mínimo 5 caracteres)'
            });
        }

        // Verificar si ya existe guía para este pedido
        const existeGuia = await guiaModel.existeGuiaPorPedido(id_pedido);
        if (existeGuia) {
            return res.status(400).json({
                success: false,
                message: 'Este pedido ya tiene una guía de remisión asociada'
            });
        }

        const guia = await guiaModel.crear({
            id_pedido,
            id_transportista,
            id_vehiculo,
            punto_partida: punto_partida.trim(),
            punto_llegada: punto_llegada.trim(),
            id_distrito,
            id_departamento
        });

        // Obtener guía con datos completos
        const guiaCompleta = await guiaModel.obtenerPorId(guia.id_guia);

        res.status(201).json({
            success: true,
            message: 'Guía de remisión creada exitosamente',
            guia: guiaCompleta
        });
    } catch (error) {
        console.error('Error al crear guía:', error);
        res.status(500).json({
            success: false,
            message: 'Error al crear la guía de remisión'
        });
    }
};

// Actualizar guía de remisión
exports.actualizarGuia = async (req, res) => {
    try {
        const { id } = req.params;
        const { id_transportista, id_vehiculo, punto_partida, punto_llegada, id_distrito, id_departamento } = req.body;

        // Validaciones
        if (!id_transportista || !id_vehiculo) {
            return res.status(400).json({
                success: false,
                message: 'Transportista y vehículo son requeridos'
            });
        }

        if (!punto_partida || !punto_llegada) {
            return res.status(400).json({
                success: false,
                message: 'Puntos de partida y llegada son requeridos'
            });
        }

        const guia = await guiaModel.actualizar(id, {
            id_transportista,
            id_vehiculo,
            punto_partida: punto_partida.trim(),
            punto_llegada: punto_llegada.trim(),
            id_distrito,
            id_departamento
        });

        if (!guia) {
            return res.status(404).json({
                success: false,
                message: 'Guía de remisión no encontrada'
            });
        }

        res.json({
            success: true,
            message: 'Guía de remisión actualizada exitosamente',
            guia
        });
    } catch (error) {
        console.error('Error al actualizar guía:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar la guía de remisión'
        });
    }
};

// Eliminar guía de remisión
exports.eliminarGuia = async (req, res) => {
    try {
        const { id } = req.params;
        const guia = await guiaModel.eliminar(id);

        if (!guia) {
            return res.status(404).json({
                success: false,
                message: 'Guía de remisión no encontrada'
            });
        }

        res.json({
            success: true,
            message: 'Guía de remisión eliminada exitosamente'
        });
    } catch (error) {
        console.error('Error al eliminar guía:', error);
        res.status(500).json({
            success: false,
            message: 'Error al eliminar la guía de remisión'
        });
    }
};
