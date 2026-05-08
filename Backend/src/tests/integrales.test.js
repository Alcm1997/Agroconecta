/**
 * PRUEBAS INTEGRALES - AgroConecta
 * Módulo: Endpoints críticos de la API REST
 * Herramienta: Jest + supertest
 */

const request = require('supertest');
const app = require('../app');

// ============================================================
// PI01 - PI02: Autenticación de administrador
// ============================================================
describe('PI01-PI02 | Autenticación Panel Admin', () => {

    test('PI01 - Login con credenciales correctas retorna token JWT', async () => {
        const res = await request(app)
            .post('/api/panel/auth/login')
            .send({ username: 'admin', password: 'admin123' });

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('token');
        expect(typeof res.body.token).toBe('string');
    });

    test('PI02 - Login con contraseña incorrecta retorna error 4xx', async () => {
        const res = await request(app)
            .post('/api/panel/auth/login')
            .send({ username: 'admin', password: 'clave_incorrecta_xyz' });

        expect(res.status).toBeGreaterThanOrEqual(400);
        expect(res.status).toBeLessThan(500);
    });
});

// ============================================================
// PI03 - PI04: Endpoints públicos de la tienda
// ============================================================
describe('PI03-PI04 | Endpoints Tienda (públicos)', () => {

    test('PI03 - GET /api/tienda/productos retorna array de productos', async () => {
        const res = await request(app).get('/api/tienda/productos');
        expect(res.status).toBe(200);
        const datos = Array.isArray(res.body) ? res.body : res.body.productos;
        expect(Array.isArray(datos)).toBe(true);
    });

    test('PI04 - GET /api/tienda/tipos-pago retorna métodos de pago', async () => {
        const res = await request(app).get('/api/tienda/tipos-pago');
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBeGreaterThan(0);
    });
});

// ============================================================
// PI05: Endpoint protegido sin token
// ============================================================
describe('PI05 | Seguridad — Endpoint protegido sin token', () => {

    test('PI05 - POST /api/tienda/pedidos sin token retorna 401 o 403', async () => {
        const res = await request(app)
            .post('/api/tienda/pedidos')
            .send({ id_tipo_pago: 1, items: [{ id_producto: 1, cantidad: 1 }] });

        expect([401, 403]).toContain(res.status);
    });
});

// ============================================================
// PI06: Acceso autenticado al panel de pedidos
// ============================================================
describe('PI06 | Gestión de pedidos con autenticación', () => {

    let tokenAdmin = null;

    beforeAll(async () => {
        const res = await request(app)
            .post('/api/panel/auth/login')
            .send({ username: 'admin', password: 'admin123' });
        if (res.body && res.body.token) {
            tokenAdmin = res.body.token;
        }
    });

    test('PI06 - GET /api/panel/pedidos con token válido retorna lista', async () => {
        expect(tokenAdmin).not.toBeNull();
        const res = await request(app)
            .get('/api/panel/pedidos')
            .set('Authorization', `Bearer ${tokenAdmin}`);

        expect(res.status).toBe(200);
        const datos = Array.isArray(res.body) ? res.body : res.body.pedidos;
        expect(Array.isArray(datos)).toBe(true);
    });
});
