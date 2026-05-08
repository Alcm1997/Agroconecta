/**
 * DTO para Departamentos
 */
class DepartamentoDTO {
    constructor(data) {
        this.id_departamento = data.id_departamento;
        this.nombre_departamento = data.nombre_departamento || '';
    }

    static transform(data) {
        if (!data) return null;
        if (Array.isArray(data)) {
            return data.map(item => new DepartamentoDTO(item));
        }
        return new DepartamentoDTO(data);
    }
}

module.exports = DepartamentoDTO;
