/**
 * PRUEBAS UNITARIAS - AgroConecta
 * Módulo: Cálculos de pedidos (IGV, totales, validación de estados)
 * Herramienta: Jest
 */

const {
    calcularIGVDesdeTotal,
    calcularTotalConIGV,
    validarTransicionEstado,
    calcularSubtotalItem,
    IGV_RATE
} = require('../utils/calculosPedido');

// ============================================================
// BLOQUE 1: Cálculo de IGV
// ============================================================
describe('PU01-PU05 | Cálculo de IGV', () => {

    test('PU01 - Cálculo de IGV estándar (total S/ 118)', () => {
        const resultado = calcularIGVDesdeTotal(118);
        expect(resultado.subtotal).toBeCloseTo(100, 1);
        expect(resultado.igv).toBeCloseTo(18, 1);
        expect(resultado.total).toBe(118);
    });

    test('PU02 - Cálculo de IGV con total cero', () => {
        const resultado = calcularIGVDesdeTotal(0);
        expect(resultado.subtotal).toBe(0);
        expect(resultado.igv).toBe(0);
        expect(resultado.total).toBe(0);
    });

    test('PU03 - Cálculo de IGV con entrada no numérica', () => {
        expect(() => calcularIGVDesdeTotal('cien')).toThrow(TypeError);
    });

    test('PU04 - Cálculo de IGV con valor negativo', () => {
        expect(() => calcularIGVDesdeTotal(-50)).toThrow(RangeError);
    });

    test('PU05 - Cálculo de total con IGV desde subtotal (S/ 200)', () => {
        const total = calcularTotalConIGV(200);
        expect(total).toBe(236);
    });
});

// ============================================================
// BLOQUE 2: Validación de transiciones de estado
// ============================================================
describe('PU06-PU10 | Validación de transición de estado', () => {

    test('PU06 - Pendiente → Entregado (debe ser válida)', () => {
        const r = validarTransicionEstado('Pendiente', 'Entregado');
        expect(r.valido).toBe(true);
    });

    test('PU07 - Pendiente → Cancelado (debe ser válida)', () => {
        const r = validarTransicionEstado('Pendiente', 'Cancelado');
        expect(r.valido).toBe(true);
    });

    test('PU08 - Entregado → Cancelado (debe ser inválida — estado final)', () => {
        const r = validarTransicionEstado('Entregado', 'Cancelado');
        expect(r.valido).toBe(false);
        expect(r.mensaje).toContain('estado final');
    });

    test('PU09 - Entregado → Pendiente (debe ser inválida — estado final)', () => {
        const r = validarTransicionEstado('Entregado', 'Pendiente');
        expect(r.valido).toBe(false);
    });

    test('PU10 - Estado destino inexistente (debe ser inválida)', () => {
        const r = validarTransicionEstado('Pendiente', 'EnProceso');
        expect(r.valido).toBe(false);
        expect(r.mensaje).toContain('inválido');
    });
});

// ============================================================
// BLOQUE 3: Cálculo de subtotales de ítems
// ============================================================
describe('PU11-PU13 | Cálculo de subtotal por ítem', () => {

    test('PU11 - Subtotal correcto (5 unidades × S/ 25)', () => {
        expect(calcularSubtotalItem(5, 25)).toBe(125);
    });

    test('PU12 - Cantidad cero lanza error', () => {
        expect(() => calcularSubtotalItem(0, 50)).toThrow(RangeError);
    });

    test('PU13 - Precio negativo lanza error', () => {
        expect(() => calcularSubtotalItem(3, -10)).toThrow(RangeError);
    });
});

// ============================================================
// BLOQUE 4: Constante IGV_RATE
// ============================================================
describe('PU14 | Tasa de IGV', () => {
    test('PU14 - La tasa de IGV debe ser 18%', () => {
        expect(IGV_RATE).toBe(0.18);
    });
});
