/**
 * clientController.js - Controlador de Clientes (Completo)
 */
const clientService = require('../Services/clientService');
const ClientDTO = require('../DTOs/clientDTO');

// --- TIENDA / CLIENTE ---

exports.registerClient = async (req, res) => {
    try {
        const client = await clientService.registrar(req.body);
        res.status(201).json({ 
            message: 'Cliente registrado correctamente.', 
            client: ClientDTO.transform(client) 
        });
    } catch (error) {
        console.error('Error en registerClient:', error);
        res.status(400).json({ message: error.message });
    }
};

exports.loginClient = async (req, res) => {
    const { email, contrasena } = req.body;
    try {
        const { token, client } = await clientService.autenticar(email, contrasena);
        res.json({
            token,
            cliente: ClientDTO.transform(client)
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.getProfile = async (req, res) => {
    try {
        const client = await clientService.obtenerPerfil(req.user.id_cliente);
        res.json(ClientDTO.transform(client));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.updateProfile = async (req, res) => {
    try {
        const updated = await clientService.actualizarPerfil(req.user.id_cliente, req.body);
        res.json({
            message: 'Perfil actualizado correctamente.',
            client: ClientDTO.transform(updated)
        });
    } catch (error) {
        console.error('Error en updateProfile:', error);
        res.status(400).json({ message: error.message });
    }
};

exports.deleteMyAccount = async (req, res) => {
    try {
        await clientService.desactivarCuenta(req.user.id_cliente);
        res.json({ message: 'Cuenta desactivada correctamente.' });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.me = async (req, res) => {
    try {
        const id_cliente = req.cliente?.id_cliente || req.user?.id_cliente;
        if (!id_cliente) return res.status(401).json({ success: false, message: 'No autenticado' });

        const client = await clientService.obtenerPorId(id_cliente);
        if (!client) return res.status(404).json({ success: false, message: 'Cliente no encontrado' });

        return res.json({ success: true, cliente: ClientDTO.transform(client) });
    } catch (e) {
        return res.status(500).json({ success: false, message: 'Error interno' });
    }
};

// --- PANEL ADMINISTRATIVO ---

exports.getAllClients = async (req, res) => {
    try {
        const clients = await clientService.listarTodos();
        res.json(ClientDTO.transform(clients));
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener clientes.' });
    }
};

exports.getAllClientsPanel = async (req, res) => {
    try {
        const clients = await clientService.listarTodosPanel();
        res.json(ClientDTO.transform(clients));
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener clientes del panel.' });
    }
};

exports.getClientById = async (req, res) => {
    try {
        const client = await clientService.obtenerPorId(req.params.id);
        if (!client) return res.status(404).json({ message: 'Cliente no encontrado.' });
        res.json(ClientDTO.transform(client));
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener cliente.' });
    }
};

exports.updateClient = async (req, res) => {
    try {
        const updated = await clientService.actualizarPerfil(req.params.id, req.body);
        res.json({ message: 'Cliente actualizado.', client: ClientDTO.transform(updated) });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.deleteClient = async (req, res) => {
    try {
        await clientService.desactivarCuenta(req.params.id);
        res.json({ message: 'Cliente desactivado.' });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.reactivateClientByAdmin = async (req, res) => {
    try {
        const updated = await clientService.reactivarCliente(req.params.id);
        res.json({ message: 'Cliente reactivado.', client: ClientDTO.transform(updated) });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// --- VERIFICACIONES (AJAX) ---

exports.checkClientByEmail = async (req, res) => {
    const { email } = req.body;
    try {
        const client = await clientService.obtenerPorEmailAnyStatus(email);
        if (!client) return res.status(404).json({ message: 'No existe una cuenta con ese correo.' });
        if (client.estado === 'Inactivo') {
            return res.status(400).json({ message: 'Cuenta inactiva. Contacta con soporte.' });
        }
        res.json({ message: 'Cliente encontrado.' });
    } catch (error) {
        res.status(500).json({ message: 'Error en el servidor.' });
    }
};

exports.checkClientByDocument = async (req, res) => {
    const { numero_documento } = req.body;
    try {
        const client = await clientService.obtenerPorDocumento(numero_documento);
        if (client) return res.status(400).json({ message: 'Este número de documento ya está registrado.' });
        res.json({ message: 'Documento disponible.' });
    } catch (error) {
        res.status(500).json({ message: 'Error en el servidor.' });
    }
};
