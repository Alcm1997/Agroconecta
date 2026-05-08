const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
    service: 'gmail', // Asumiendo que es Gmail por la dirección
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

/**
 * Función para enviar correos
 * @param {string} to - Destinatario
 * @param {string} subject - Asunto del correo
 * @param {string} html - Cuerpo del correo en HTML
 */
const sendMail = async (to, subject, html) => {
    try {
        const mailOptions = {
            from: `"Pitahaya Perú" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            html
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Correo enviado exitosamente:', info.messageId);
        return info;
    } catch (error) {
        console.error('Error al enviar correo:', error);
        throw error;
    }
};

module.exports = { sendMail };
