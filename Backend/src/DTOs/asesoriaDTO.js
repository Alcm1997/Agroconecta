/**
 * DTO para estandarizar la salida de datos de Asesoría
 */
class AsesoriaDTO {
    constructor(data) {
        this.id = data.id_asesoria || data.id;
        this.nombreCliente = data.nombre ? data.nombre.toUpperCase() : 'N/A';
        this.emailContacto = data.email ? data.email.toLowerCase() : 'N/A';
        this.resumenMensaje = data.mensaje ? data.mensaje.substring(0, 50) + '...' : '';
        this.fechaCreacion = data.fecha_creacion || new Date().toISOString();
    }

    /**
     * Método estático para transformar un resultado
     */
    static transform(data) {
        if (!data) return null;
        return new AsesoriaDTO(data);
    }
}

module.exports = AsesoriaDTO;
