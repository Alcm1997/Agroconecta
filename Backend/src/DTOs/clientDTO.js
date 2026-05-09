/**
 * clientDTO.js - Data Transfer Object para Clientes
 */
class ClientDTO {
    constructor(data) {
        this.id_cliente = data.id_cliente;
        this.tipo_cliente = data.tipo_cliente;
        this.numero_documento = data.numero_documento;
        this.email = data.email || data.correo; // Soporte para alias 'correo'
        this.telefono = data.telefono;
        this.direccion = data.direccion;
        this.id_distrito = data.id_distrito;
        this.estado = data.estado;
        
        // Datos condicionales
        if (data.tipo_cliente === 'Natural') {
            this.nombres = data.nombres || '';
            this.apellidos = data.apellidos || '';
            this.nombre_completo = `${this.nombres} ${this.apellidos}`.trim();
        } else {
            this.razon_social = data.razon_social || '';
            this.nombre_comercial = data.nombre_comercial || '';
            this.nombre_completo = this.razon_social;
        }
    }

    static transform(data) {
        if (!data) return null;
        if (Array.isArray(data)) {
            return data.map(item => new ClientDTO(item));
        }
        return new ClientDTO(data);
    }
}

module.exports = ClientDTO;
