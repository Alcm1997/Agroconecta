const reporteModel = require('../Models/reporteModel');

// Obtener dashboard completo
exports.getDashboard = async (req, res) => {
    try {
        const data = await reporteModel.obtenerDashboardCompleto();
        res.json({
            success: true,
            ...data
        });
    } catch (error) {
        console.error('Error al obtener dashboard:', error);
        res.status(500).json({
            success: false,
            message: 'Error al cargar el dashboard de reportes'
        });
    }
};

// Obtener solo resumen (KPIs)
exports.getResumen = async (req, res) => {
    try {
        const resumen = await reporteModel.obtenerResumenGeneral();
        res.json({ success: true, resumen });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Error al obtener resumen' });
    }
};

// Obtener ventas por mes
exports.getVentasMes = async (req, res) => {
    try {
        const ventas = await reporteModel.obtenerVentasPorMes();
        res.json({ success: true, ventas });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Error al obtener ventas' });
    }
};

// Obtener top productos
exports.getTopProductos = async (req, res) => {
    try {
        const productos = await reporteModel.obtenerTopProductos();
        res.json({ success: true, productos });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Error al obtener productos' });
    }
};
