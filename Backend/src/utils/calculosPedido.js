/**
 * Utilidades de cálculo para pedidos - AgroConecta
 * Funciones puras sin dependencias externas (testeables con Jest)
 */

const IGV_RATE = 0.18;

/**
 * Calcula el IGV dado un total con IGV incluido
 * @param {number} totalConIGV
 * @returns {{ subtotal: number, igv: number, total: number }}
 */
function calcularIGVDesdeTotal(totalConIGV) {
    if (typeof totalConIGV !== 'number' || isNaN(totalConIGV)) {
        throw new TypeError('El total debe ser un número válido');
    }
    if (totalConIGV < 0) {
        throw new RangeError('El total no puede ser negativo');
    }
    const subtotal = totalConIGV / (1 + IGV_RATE);
    const igv = totalConIGV - subtotal;
    return {
        subtotal: parseFloat(subtotal.toFixed(2)),
        igv: parseFloat(igv.toFixed(2)),
        total: parseFloat(totalConIGV.toFixed(2))
    };
}

/**
 * Calcula el total con IGV dado un subtotal (sin IGV)
 * @param {number} subtotal
 * @returns {number}
 */
function calcularTotalConIGV(subtotal) {
    if (typeof subtotal !== 'number' || isNaN(subtotal)) {
        throw new TypeError('El subtotal debe ser un número válido');
    }
    if (subtotal < 0) {
        throw new RangeError('El subtotal no puede ser negativo');
    }
    return parseFloat((subtotal * (1 + IGV_RATE)).toFixed(2));
}

/**
 * Valida si una transición de estado de pedido está permitida
 * @param {string} estadoActual
 * @param {string} estadoNuevo
 * @returns {{ valido: boolean, mensaje: string }}
 */
function validarTransicionEstado(estadoActual, estadoNuevo) {
    const estadosValidos = ['Pendiente', 'Entregado', 'Cancelado'];

    if (!estadosValidos.includes(estadoNuevo)) {
        return { valido: false, mensaje: `Estado inválido: ${estadoNuevo}` };
    }

    const transicionesPermitidas = {
        'Pendiente': ['Entregado', 'Cancelado'],
        'Entregado': [],
        'Cancelado': ['Pendiente']
    };

    const permitidas = transicionesPermitidas[estadoActual] || [];
    if (!permitidas.includes(estadoNuevo)) {
        const msg = estadoActual === 'Entregado'
            ? 'Un pedido Entregado es estado final y no puede modificarse.'
            : `No se puede cambiar de "${estadoActual}" a "${estadoNuevo}".`;
        return { valido: false, mensaje: msg };
    }

    return { valido: true, mensaje: 'Transición permitida' };
}

/**
 * Calcula el subtotal de un ítem del pedido
 * @param {number} cantidad
 * @param {number} precioUnitario
 * @returns {number}
 */
function calcularSubtotalItem(cantidad, precioUnitario) {
    if (cantidad <= 0 || precioUnitario <= 0) {
        throw new RangeError('Cantidad y precio deben ser mayores a 0');
    }
    return parseFloat((cantidad * precioUnitario).toFixed(2));
}

module.exports = {
    calcularIGVDesdeTotal,
    calcularTotalConIGV,
    validarTransicionEstado,
    calcularSubtotalItem,
    IGV_RATE
};
