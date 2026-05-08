/**
 * DTO para Categorías (Compatible con Frontend)
 */
class CategoriaDTO {
    constructor(data) {
        this.id_categoria = data.id_categoria;
        this.descripcion = data.descripcion || 'N/A';
    }

    static transform(data) {
        if (!data) return null;
        if (Array.isArray(data)) {
            return data.map(item => new CategoriaDTO(item));
        }
        return new CategoriaDTO(data);
    }
}

module.exports = CategoriaDTO;
