/**
 * DTO para Distritos
 */
class DistritoDTO {
    constructor(data) {
        this.id_distrito = data.id_distrito;
        this.nombre_distrito = data.nombre_distrito || '';
        this.id_departamento = data.id_departamento;
    }

    static transform(data) {
        if (!data) return null;
        if (Array.isArray(data)) {
            return data.map(item => new DistritoDTO(item));
        }
        return new DistritoDTO(data);
    }
}

module.exports = DistritoDTO;
