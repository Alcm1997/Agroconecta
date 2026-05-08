/**
 * DTO para Transportistas (Compatible con el Frontend actual)
 */
class TransportistaDTO {
    constructor(data) {
        // Mantenemos los nombres de la BD para que el Frontend no se rompa
        this.id_transportista = data.id_transportista;
        this.razon_social = data.razon_social || 'N/A';
        this.ruc = data.ruc;
        this.cantidad_vehiculos = parseInt(data.cantidad_vehiculos) || 0;
    }

    static transform(data) {
        if (!data) return null;
        if (Array.isArray(data)) {
            return data.map(item => new TransportistaDTO(item));
        }
        return new TransportistaDTO(data);
    }
}

module.exports = TransportistaDTO;
