/**
 * DTO para Items del Carrito
 */
class CarritoDTO {
    constructor(data) {
        this.id_carrito = data.id_carrito;
        this.id_producto = data.id_producto;
        this.nombre = data.nombre || '';
        this.cantidad = parseFloat(data.cantidad) || 0;
        this.precio_unitario = parseFloat(data.precio_unitario) || 0;
        this.unidad_medida = data.unidad_medida || '';
        this.imagen_url = data.imagen_url || '';
        this.opciones = data.opciones || [];
        this.fecha_agregado = data.fecha_agregado;
        
        // Cálculo automático del subtotal
        this.subtotal = Number((this.cantidad * this.precio_unitario).toFixed(2));
    }

    static transform(data) {
        if (!data) return null;
        if (Array.isArray(data)) {
            const items = data.map(item => new CarritoDTO(item));
            // Calculamos el total general del carrito también
            const total_carrito = Number(items.reduce((sum, item) => sum + item.subtotal, 0).toFixed(2));
            return {
                items,
                total_carrito
            };
        }
        return new CarritoDTO(data);
    }
}

module.exports = CarritoDTO;
