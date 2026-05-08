const asesoriaModel = require('../Models/asesoriaModel');
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

/**
 * Servicio para procesar nuevas consultas de asesoría
 */
exports.procesarNuevaConsulta = async (datos) => {
    const { nombre, email, mensaje } = datos;

    // 1. Guardar en Base de Datos
    const consulta = await asesoriaModel.crearConsulta({
        nombre: nombre.trim(),
        email: email.trim().toLowerCase(),
        mensaje: mensaje.trim()
    });

    // 2. Enviar email de notificación al administrador
    const mailAdmin = {
        from: `"Pitahaya Perú - Asesoría" <${process.env.EMAIL_USER}>`,
        to: process.env.EMAIL_USER,
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
            </div>
          </div>
        `
    };

    // 3. Enviar confirmación al cliente
    const mailCliente = {
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
              <p><strong>Tiempo estimado de respuesta:</strong> 24-48 horas hábiles</p>
            </div>
          </div>
        `
    };

    // Lanzamos los correos en segundo plano para no hacer esperar al cliente
    transporter.sendMail(mailAdmin).catch(e => console.error('Error mail admin:', e.message));
    transporter.sendMail(mailCliente).catch(e => console.error('Error mail cliente:', e.message));

    return {
        id: consulta.id_consulta,
        fecha: consulta.fecha_consulta,
        nombre: nombre,
        email: email,
        mensaje: mensaje
    };
};
