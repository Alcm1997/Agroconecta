const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt');
const clientModel = require('../Models/clientModel');
const recoveryModel = require('../Models/recoveryModel');

// Función para obtener configuración de correo según el proveedor
function getEmailConfig(userEmail) {
  const email = userEmail.toLowerCase();
  
  if (email.includes('gmail')) {
    return {
      service: 'gmail',
      host: 'smtp.gmail.com',
      port: 587,
      secure: false
    };
  } else if (email.includes('outlook') || email.includes('hotmail') || email.includes('live')) {
    return {
      service: 'hotmail',
      host: 'smtp-mail.outlook.com',
      port: 587,
      secure: false
    };
  } else {
    // Configuración genérica para otros proveedores
    return {
      host: 'smtp.gmail.com', // Fallback a Gmail
      port: 587,
      secure: false
    };
  }
}

exports.sendRecoveryCode = async (req, res) => {
  try {
    const { email } = req.body;

    // Validar que se envió el email
    if (!email) {
      return res.status(400).json({ message: 'El correo es requerido.' });
    }

    // Verificar si el cliente existe
    const client = await clientModel.getClientByEmail(email);
    if (!client) {
      return res.status(404).json({ message: 'No existe una cuenta con ese correo electrónico.' });
    }

    // Generar código de 6 dígitos y fecha de expiración (10 minutos)
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiracion = new Date(Date.now() + 10 * 60 * 1000); // 10 minutos

    // Guardar el código en la base de datos
    await recoveryModel.saveRecoveryCode(email, code, expiracion);

    // Obtener configuración según el proveedor de correo del remitente
    const emailConfig = getEmailConfig(process.env.EMAIL_USER);

    // Configurar transporte de correo
    const transporter = nodemailer.createTransport({
      ...emailConfig,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    // Contenido del correo profesional
    const mailOptions = {
      from: `"AgroConecta - Pitahaya Perú" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: '🔐 Código de Recuperación de Contraseña - AgroConecta',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
          <div style="background: linear-gradient(135deg, #E91E63, #FFC107); padding: 30px; border-radius: 15px; text-align: center; color: white;">
            <h1 style="margin: 0; font-size: 28px;">🌿 AgroConecta</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px;">Pitahaya Perú</p>
          </div>
          
          <div style="background: white; padding: 30px; border-radius: 15px; margin-top: 20px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
            <h2 style="color: #E91E63; text-align: center; margin-bottom: 20px;">Recuperación de Contraseña</h2>
            
            <p style="font-size: 16px; color: #333; line-height: 1.6;">
              Hola, hemos recibido una solicitud para restablecer la contraseña de tu cuenta en AgroConecta.
            </p>
            
            <div style="background: #f8f9fa; border-left: 4px solid #E91E63; padding: 20px; margin: 25px 0; border-radius: 5px;">
              <p style="margin: 0; font-size: 14px; color: #666;">Tu código de verificación es:</p>
              <h1 style="margin: 10px 0; font-size: 32px; color: #E91E63; text-align: center; letter-spacing: 3px; font-family: monospace;">
                ${code}
              </h1>
              <p style="margin: 0; font-size: 14px; color: #666; text-align: center;">
                <strong>⏰ Este código expira en 10 minutos</strong>
              </p>
            </div>
            
            <p style="font-size: 14px; color: #666; line-height: 1.6;">
              Si no solicitaste este cambio, puedes ignorar este correo. Tu contraseña permanecerá sin cambios.
            </p>
            
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
              <p style="font-size: 12px; color: #999;">
                © 2025 AgroConecta - Pitahaya Perú<br>
                Conectando el campo con tu mesa 🌱
              </p>
            </div>
          </div>
        </div>
      `
    };

    // Enviar el correo
    await transporter.sendMail(mailOptions);

    res.json({ 
      message: 'Código de recuperación enviado correctamente a tu correo electrónico.',
      email: email 
    });

  } catch (error) {
    console.error('Error al enviar código de recuperación:', error);
    res.status(500).json({ message: 'Error interno del servidor. Inténtalo más tarde.' });
  }
};

// AÑADIR también la función resetPassword que mencioné antes...
exports.resetPassword = async (req, res) => {
  try {
    const { email, codigo, nuevaContrasena } = req.body;

    // Validaciones
    if (!email || !codigo || !nuevaContrasena) {
      return res.status(400).json({ message: 'Todos los campos son requeridos.' });
    }

    if (nuevaContrasena.length < 8) {
      return res.status(400).json({ message: 'La contraseña debe tener al menos 8 caracteres.' });
    }

    // ✅ VERIFICAR: Cliente existe (cualquier estado para recuperación)
    const client = await clientModel.getClientByEmailAnyStatus(email);
    if (!client) {
      return res.status(404).json({ message: 'No se encontró una cuenta con este email.' });
    }

    // ✅ VERIFICAR: Si la cuenta está inactiva, informar al usuario
    if (client.estado === 'Inactivo') {
      return res.status(400).json({ 
        message: 'Esta cuenta está inactiva. Contacta con soporte para reactivarla antes de cambiar la contraseña.' 
      });
    }

    // Verificar el código
    const recoveryRecord = await recoveryModel.getRecoveryCode(email, codigo);
    
    if (!recoveryRecord) {
      return res.status(400).json({ message: 'Código de recuperación inválido.' });
    }

    // Verificar expiración
    if (new Date() > new Date(recoveryRecord.expiracion)) {
      await recoveryModel.deleteRecoveryCode(email, codigo);
      return res.status(400).json({ message: 'El código de recuperación ha expirado. Solicita uno nuevo.' });
    }

    // Encriptar nueva contraseña
    const hashedPassword = await bcrypt.hash(nuevaContrasena, 10);

    // Actualizar contraseña
    await clientModel.updatePassword(email, hashedPassword);

    // Eliminar código usado
    await recoveryModel.deleteRecoveryCode(email, codigo);

    console.log(`✅ Contraseña actualizada para: ${email}`);

    res.json({ message: 'Contraseña actualizada correctamente. Ya puedes iniciar sesión.' });

  } catch (error) {
    console.error('Error al cambiar contraseña:', error);
    res.status(500).json({ message: 'Error interno del servidor. Inténtalo más tarde.' });
  }
};
