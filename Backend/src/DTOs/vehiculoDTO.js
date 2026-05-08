/**
 * DTO para Vehículos (Compatible con el Frontend actual)
 */
class VehiculoDTO {
    constructor(data) {
        this.id_vehiculo = data.id_vehiculo;
        this.placa = data.placa ? data.placa.toUpperCase() : 'N/A';
        this.id_transportista = data.id_transportista;
        // Corregido: El frontend busca 'transportista_nombre' para la columna Transportista
        this.transportista_nombre = data.transportista_nombre || 'N/A';
    }

    static transform(data) {
        if (!data) return null;
        if (Array.isArray(data)) {
            return data.map(item => new VehiculoDTO(item));
        }
        return new VehiculoDTO(data);
    }
}

module.exports = VehiculoDTO;
