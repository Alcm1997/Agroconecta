const AsesoriaService = require('../Services/asesoriaService');
const AsesoriaDTO = require('../DTOs/asesoriaDTO');
const asesoriaModel = require('../Models/asesoriaModel');
const { sendMail } = require('../utils/mailer');
const nodemailer = require('nodemailer');


// Crear nueva consulta de asesoría (público)
exports.crearConsulta = async (req, res) => {
    try {
        // Delegamos todo el procesamiento al servicio (BD + Emails)
        const resultado = await AsesoriaService.procesarNuevaConsulta(req.body);

        // Formateamos la respuesta usando el DTO
        res.status(201).json({
            success: true,
            message: '¡Consulta enviada exitosamente! Te responderemos pronto.',
            consulta: AsesoriaDTO.transform(resultado)
        });
    } catch (error) {
        console.error('❌ Error en crearConsulta:', error);
        res.status(500).json({
            success: false,
            message: 'Error al enviar la consulta. Intenta nuevamente.'
        });
    }
};

// Listar consultas (admin)
exports.listarConsultas = async (req, res) => {
    try {
        const { estado, page, limit } = req.query;

        const resultado = await asesoriaModel.obtenerConsultas({
            estado,
            page: parseInt(page) || 1,
            limit: parseInt(limit) || 20
        });

        res.json({
            success: true,
            ...resultado
        });

    } catch (error) {
        console.error('Error al listar consultas:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener las consultas'
        });
    }
};

// Obtener detalle de consulta (admin)
exports.obtenerConsulta = async (req, res) => {
    try {
        const { id } = req.params;

        const consulta = await asesoriaModel.obtenerConsultaPorId(id);

        if (!consulta) {
            return res.status(404).json({
                success: false,
                message: 'Consulta no encontrada'
            });
        }

        res.json({
            success: true,
            consulta
        });

    } catch (error) {
        console.error('Error al obtener consulta:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener la consulta'
        });
    }
};

// Marcar como respondida y enviar correo (admin)
exports.marcarRespondida = async (req, res) => {
    try {
        const { id } = req.params;
        const { respuesta } = req.body; // <-- Recibimos la respuesta del frontend
        const id_usuario = req.user?.id_usuario;

        if (!respuesta || respuesta.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'El texto de la respuesta es obligatorio.'
            });
        }

        // Obtener la consulta para saber el email del cliente
        const consultaExistente = await asesoriaModel.obtenerConsultaPorId(id);
        if (!consultaExistente) {
            return res.status(404).json({
                success: false,
                message: 'Consulta no encontrada'
            });
        }

        // Preparar el cuerpo del correo en HTML
        const htmlBody = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
                <div style="background: linear-gradient(135deg, #2E7D32, #4CAF50); padding: 20px; text-align: center;">
                    <h1 style="color: white; margin: 0;">🌱 Pitahaya Perú</h1>
                </div>
                <div style="background: #f9f9f9; padding: 20px; border: 1px solid #ddd;">
                    <h2 style="color: #2E7D32;">¡Hola ${consultaExistente.nombre}!</h2>
                    <p>En respuesta a tu consulta sobre: <em>"${consultaExistente.mensaje.substring(0, 100)}..."</em></p>
                    
                    <div style="background: white; padding: 15px; border-radius: 8px; border-left: 4px solid #2E7D32; margin: 20px 0;">
                        <p style="white-space: pre-wrap; margin: 0;">${respuesta}</p>
                    </div>
                    
                    <p>Esperamos que esta información te sea de utilidad.</p>
                    
                    <p style="color: #666; font-size: 14px; margin-top: 20px;">
                        Saludos cordiales,<br>
                        <strong>Equipo Pitahaya Perú</strong>
                    </p>
                </div>
                <div style="background: #333; color: white; padding: 10px; text-align: center; font-size: 12px;">
                    © ${new Date().getFullYear()} Pitahaya Perú - Asesoría en cultivo de pitahaya
                </div>
            </div>
        `;

        // Enviar el correo
        await sendMail(consultaExistente.email, 'Pitahaya Perú - Respuesta a tu consulta', htmlBody);

        // Si el correo se envía, actualizamos en la Base de Datos
        const consulta = await asesoriaModel.marcarComoRespondida(id, id_usuario, respuesta);

        res.json({
            success: true,
            message: 'Respuesta enviada y guardada correctamente',
            consulta
        });

    } catch (error) {
        console.error('Error al marcar consulta y enviar correo:', error);
        res.status(500).json({
            success: false,
            message: 'Error al enviar el correo o actualizar la consulta'
        });
    }
};

// Cambiar estado (admin)
exports.cambiarEstado = async (req, res) => {
    try {
        const { id } = req.params;
        const { estado } = req.body;

        const estadosValidos = ['Pendiente', 'Respondida', 'Cerrada'];
        if (!estadosValidos.includes(estado)) {
            return res.status(400).json({
                success: false,
                message: `Estado inválido. Debe ser: ${estadosValidos.join(', ')}`
            });
        }

        const consulta = await asesoriaModel.cambiarEstado(id, estado);

        if (!consulta) {
            return res.status(404).json({
                success: false,
                message: 'Consulta no encontrada'
            });
        }

        res.json({
            success: true,
            message: 'Estado actualizado',
            consulta
        });

    } catch (error) {
        console.error('Error al cambiar estado:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar el estado'
        });
    }
};
