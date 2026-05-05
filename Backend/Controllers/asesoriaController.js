const asesoriaModel = require('../Models/asesoriaModel');
const nodemailer = require('nodemailer');
const { sendMail } = require('../utils/mailer');

// Configurar transporter de email
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Crear nueva consulta de asesoría (público)
exports.crearConsulta = async (req, res) => {
    try {
        const { nombre, email, mensaje } = req.body;

        // Validaciones
        if (!nombre || nombre.trim().length < 2) {
            return res.status(400).json({
                success: false,
                message: 'El nombre es requerido (mínimo 2 caracteres)'
            });
        }

        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Email inválido'
            });
        }

        if (!mensaje || mensaje.trim().length < 10) {
            return res.status(400).json({
                success: false,
                message: 'El mensaje es requerido (mínimo 10 caracteres)'
            });
        }

        // Guardar en BD
        const consulta = await asesoriaModel.crearConsulta({
            nombre: nombre.trim(),
            email: email.trim().toLowerCase(),
            mensaje: mensaje.trim()
        });

        // Enviar email de notificación al administrador
        try {
            await transporter.sendMail({
                from: `"Pitahaya Perú - Asesoría" <${process.env.EMAIL_USER}>`,
                to: process.env.EMAIL_USER, // Enviar al mismo email del administrador
                subject: `🌱 Nueva consulta de asesoría - ${nombre}`,
                html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #2E7D32, #4CAF50); padding: 20px; text-align: center;">
              <h1 style="color: white; margin: 0;">🌱 Nueva Consulta de Asesoría</h1>
            </div>
            <div style="background: #f9f9f9; padding: 20px; border: 1px solid #ddd;">
              <h2 style="color: #2E7D32;">Datos del cliente:</h2>
              <p><strong>Nombre:</strong> ${nombre}</p>
              <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
              <p><strong>Fecha:</strong> ${new Date().toLocaleString('es-PE')}</p>
              
              <h2 style="color: #2E7D32;">Mensaje:</h2>
              <div style="background: white; padding: 15px; border-radius: 8px; border-left: 4px solid #2E7D32;">
                <p style="white-space: pre-wrap;">${mensaje}</p>
              </div>
              
              <div style="margin-top: 20px; text-align: center;">
                <a href="mailto:${email}?subject=Re: Asesoría Pitahaya Perú" 
                   style="background: #E91E63; color: white; padding: 12px 24px; text-decoration: none; border-radius: 25px; display: inline-block;">
                  Responder al cliente
                </a>
              </div>
            </div>
            <div style="background: #333; color: white; padding: 10px; text-align: center; font-size: 12px;">
              Pitahaya Perú - Sistema de Asesoría Gratuita
            </div>
          </div>
        `
            });
            console.log('✅ Email de notificación enviado');
        } catch (emailError) {
            console.error('⚠️ Error enviando email (consulta guardada):', emailError.message);
            // No fallar la consulta si el email falla
        }

        // Enviar confirmación al cliente
        try {
            await transporter.sendMail({
                from: `"Pitahaya Perú" <${process.env.EMAIL_USER}>`,
                to: email,
                subject: '✅ Recibimos tu consulta - Pitahaya Perú',
                html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #2E7D32, #4CAF50); padding: 20px; text-align: center;">
              <h1 style="color: white; margin: 0;">🌱 Pitahaya Perú</h1>
            </div>
            <div style="background: #f9f9f9; padding: 20px; border: 1px solid #ddd;">
              <h2 style="color: #2E7D32;">¡Hola ${nombre}!</h2>
              <p>Hemos recibido tu consulta de asesoría gratuita. Nuestro equipo de expertos la revisará y te responderá a la brevedad.</p>
              
              <div style="background: white; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p><strong>Tu mensaje:</strong></p>
                <p style="color: #666; font-style: italic;">"${mensaje.substring(0, 200)}${mensaje.length > 200 ? '...' : ''}"</p>
              </div>
              
              <p><strong>Tiempo estimado de respuesta:</strong> 24-48 horas hábiles</p>
              
              <p style="color: #666; font-size: 14px; margin-top: 20px;">
                Si tienes alguna urgencia, puedes contactarnos por:<br>
                📞 +51 993 346 052<br>
                📧 ${process.env.EMAIL_USER}
              </p>
            </div>
            <div style="background: #333; color: white; padding: 10px; text-align: center; font-size: 12px;">
              © ${new Date().getFullYear()} Pitahaya Perú - Asesoría en cultivo de pitahaya
            </div>
          </div>
        `
            });
            console.log('✅ Email de confirmación enviado al cliente');
        } catch (emailError) {
            console.error('⚠️ Error enviando confirmación al cliente:', emailError.message);
        }

        res.status(201).json({
            success: true,
            message: '¡Consulta enviada exitosamente! Te responderemos pronto.',
            consulta: {
                id_consulta: consulta.id_consulta,
                fecha: consulta.fecha_consulta
            }
        });

    } catch (error) {
        console.error('Error al crear consulta de asesoría:', error);
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
