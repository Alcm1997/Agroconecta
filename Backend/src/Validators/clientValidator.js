/**
 * clientValidator.js - Validaciones para el módulo de Clientes
 */

// Regex para contraseña: 8-15 caracteres, al menos una letra, un número y un símbolo
const passRegex = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])[A-Za-z\d!@#$%^&*(),.?":{}|<>]{8,15}$/;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

exports.validarRegistro = (req, res, next) => {
    let { 
        tipo_cliente, 
        numero_documento, 
        email, 
        contrasena, 
        nombres, 
        apellidos, 
        razon_social,
        telefono,
        direccion,
        id_distrito
    } = req.body;

    // 1. Campos obligatorios comunes
    if (!tipo_cliente || !numero_documento || !email || !contrasena || !telefono || !direccion || !id_distrito) {
        return res.status(400).json({ message: 'Faltan campos obligatorios.' });
    }

    // 2. Validación de Email (Longitud máx 50)
    if (email.length > 50 || !emailRegex.test(email)) {
        return res.status(400).json({ message: 'Correo electrónico inválido (máx. 50 caracteres).' });
    }

    // 3. Validación de Contraseña
    if (!passRegex.test(contrasena)) {
        return res.status(400).json({ 
            message: 'La contraseña debe tener entre 8 y 15 caracteres, incluir letras, números y al menos un símbolo.' 
        });
    }

    // 4. Validación por Tipo de Cliente y Limpieza
    if (tipo_cliente === 'Natural') {
        if (!nombres || !apellidos) {
            return res.status(400).json({ message: 'Nombres y apellidos son obligatorios para clientes naturales.' });
        }
        if (!/^\d{8}$/.test(numero_documento)) {
            return res.status(400).json({ message: 'El DNI debe tener exactamente 8 dígitos.' });
        }
        // Limpieza: Natural no tiene razón social
        req.body.razon_social = null;
    } else if (tipo_cliente === 'Jurídica') {
        if (!razon_social) {
            return res.status(400).json({ message: 'Razón social es obligatoria para clientes jurídicos.' });
        }
        if (!/^20\d{9}$/.test(numero_documento)) {
            return res.status(400).json({ message: 'El RUC debe empezar con 20 y tener 11 dígitos.' });
        }
        // Limpieza: Jurídica no tiene nombres/apellidos
        req.body.nombres = null;
        req.body.apellidos = null;
    } else {
        return res.status(400).json({ message: 'Tipo de cliente inválido.' });
    }

    // 5. Validación de Teléfono (9 dígitos)
    if (!/^\d{9}$/.test(telefono)) {
        return res.status(400).json({ message: 'El teléfono debe tener exactamente 9 dígitos.' });
    }

    next();
};

exports.validarLogin = (req, res, next) => {
    const { email, contrasena } = req.body;

    if (!email || !contrasena) {
        return res.status(400).json({ message: 'Email y contraseña son obligatorios.' });
    }

    if (email.length > 50 || !emailRegex.test(email)) {
        return res.status(400).json({ message: 'Correo electrónico inválido.' });
    }

    // No validamos complejidad en login para no bloquear cuentas si las reglas cambiaron,
    // solo longitud básica para evitar payloads gigantes.
    if (contrasena.length < 8 || contrasena.length > 15) {
        return res.status(400).json({ message: 'Contraseña fuera de los límites permitidos.' });
    }

    next();
};

exports.validarActualizacionPerfil = (req, res, next) => {
    const { tipo_cliente, numero_documento, email, contrasena, telefono, razon_social, direccion } = req.body;

    if (email && (email.length > 50 || !emailRegex.test(email))) {
        return res.status(400).json({ message: 'Correo electrónico inválido (máx. 50 caracteres).' });
    }

    if (direccion && direccion.length > 150) {
        return res.status(400).json({ message: 'La dirección es demasiado larga (máx. 150 caracteres).' });
    }

    if (contrasena && contrasena.trim() !== '' && !passRegex.test(contrasena)) {
        return res.status(400).json({ 
            message: 'La nueva contraseña debe tener entre 8 y 15 caracteres, incluir letras, números y un símbolo.' 
        });
    }

    if (telefono && !/^\d{9}$/.test(telefono)) {
        return res.status(400).json({ message: 'El teléfono debe tener exactamente 9 dígitos.' });
    }

    if (numero_documento) {
        if (tipo_cliente === 'Natural' && !/^\d{8}$/.test(numero_documento)) {
            return res.status(400).json({ message: 'DNI inválido.' });
        }
        if (tipo_cliente === 'Jurídica') {
            if (!/^20\d{9}$/.test(numero_documento)) {
                return res.status(400).json({ message: 'RUC inválido (debe empezar con 20).' });
            }
            if (razon_social && razon_social.length > 60) {
                return res.status(400).json({ message: 'La razón social es demasiado larga (máx. 60 caracteres).' });
            }
        }
    }

    // Limpieza según tipo si se cambia o se mantiene
    if (tipo_cliente === 'Natural') {
        req.body.razon_social = null;
    } else if (tipo_cliente === 'Jurídica') {
        req.body.nombres = null;
        req.body.apellidos = null;
    }

    next();
};
