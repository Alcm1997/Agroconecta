/**
 * DTO para Usuarios Administrativos
 * Elimina datos sensibles como la contraseña
 */
class UserDTO {
    constructor(data) {
        this.id_usuario = data.id_usuario;
        this.nombres = data.nombres || '';
        this.apellidos = data.apellidos || '';
        this.email = data.email || '';
        this.username = data.username || '';
        this.id_cargo = data.id_cargo;
        this.cargo = data.cargo || 'Sin cargo';
        this.estado = data.estado || 'Activo';
        this.fecha_registro = data.fecha_registro;
    }

    static transform(data) {
        if (!data) return null;
        if (Array.isArray(data)) {
            return data.map(item => new UserDTO(item));
        }
        return new UserDTO(data);
    }
}

module.exports = UserDTO;
