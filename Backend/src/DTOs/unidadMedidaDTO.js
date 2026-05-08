/**
 * DTO para Unidades de Medida
 */
class UnidadMedidaDTO {
    constructor(data) {
        this.id_unidad = data.id_unidad;
        // Respetamos mayúsculas y minúsculas originales
        this.descripcion = data.descripcion || 'N/A';
    }

    static transform(data) {
        if (!data) return null;
        if (Array.isArray(data)) {
            return data.map(item => new UnidadMedidaDTO(item));
        }
        return new UnidadMedidaDTO(data);
    }
}

module.exports = UnidadMedidaDTO;
