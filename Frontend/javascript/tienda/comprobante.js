// Lógica del Comprobante de Pago
(function () {
    const S = v => `S/ ${Number(v || 0).toFixed(2)}`;

    const getToken = () => {
        const keys = ['token_cliente', 'cliente_token', 'token'];
        for (const k of keys) {
            const t = localStorage.getItem(k) || sessionStorage.getItem(k);
            if (t) return t.replace(/^"|"$/g, '').trim();
        }
        return '';
    };

    async function obtenerPerfilCliente() {
        const token = getToken();
        if (!token) return null;
        try {
            const response = await fetch('/api/client/me', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                return data.cliente || null;
            }
        } catch (error) {
            console.error('Error al obtener perfil:', error);
        }
        return null;
    }

    function normalizarCliente(cliente) {
        if (!cliente) return { nombres: '', apellidos: '', numero_documento: '', telefono: '', email: '' };
        if (cliente.tipo_cliente === 'juridico') {
            return {
                nombres: cliente.razon_social || '',
                apellidos: '',
                numero_documento: cliente.numero_documento || '',
                telefono: cliente.telefono || '',
                email: cliente.email || ''
            };
        } else {
            return {
                nombres: cliente.nombres || '',
                apellidos: cliente.apellidos || '',
                numero_documento: cliente.numero_documento || '',
                telefono: cliente.telefono || '',
                email: cliente.email || ''
            };
        }
    }

    async function loadComprobanteData() {
        const pedidoData = localStorage.getItem('ultimo_pedido');
        if (!pedidoData) return renderSinDatos();

        try {
            let data = JSON.parse(pedidoData);
            
            // Si el nombre del cliente en local está incompleto, intentamos traer el perfil real
            const perfilCompleto = await obtenerPerfilCliente();
            if (perfilCompleto) {
                data.cliente = normalizarCliente(perfilCompleto);
            }

            renderComprobante(data);
        } catch (e) {
            console.error('Error al cargar comprobante:', e);
            renderSinDatos();
        }
    }

    function renderSinDatos() {
        const mainEl = document.querySelector('main');
        if (!mainEl) return;
        mainEl.innerHTML = `
            <div class="text-center py-5">
                <div class="alert alert-warning shadow-sm rounded-4">
                    <i class="fas fa-exclamation-circle fa-3x mb-3 text-warning"></i>
                    <h4>No se encontraron datos del comprobante</h4>
                    <p>Por favor, realiza un pedido primero o revisa tu historial.</p>
                    <a href="/" class="btn btn-success rounded-pill px-4 mt-2">Ir a la tienda</a>
                </div>
            </div>`;
    }

    function renderComprobante(data) {
        // Cliente
        const c = data.cliente || {};
        const nombreDisplay = `${c.nombres || ''} ${c.apellidos || ''}`.trim() || 'Cliente';
        document.getElementById('nombreCliente').textContent = nombreDisplay;
        document.getElementById('documentoCliente').textContent = c.numero_documento || '-';
        document.getElementById('telefonoCliente').textContent = c.telefono || '-';
        document.getElementById('emailCliente').textContent = c.email || '-';

        // Encabezado
        document.getElementById('tipoComprobante').textContent = (data.tipo_comprobante || 'BOLETA').toUpperCase();
        document.getElementById('numeroComprobante').textContent = data.numero_comprobante || 'BO000-000';

        // Fecha y método
        const fecha = data.fecha_pedido ? new Date(data.fecha_pedido) : new Date();
        document.getElementById('fechaPedido').textContent = fecha.toLocaleDateString('es-PE');
        document.getElementById('horaPedido').textContent = fecha.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        
        // Priorizar el nombre oficial que viene de la BD
        const nombreMetodo = data.metodo_pago || data.tipo_pago || 'Pago Online';
        document.getElementById('metodoPago').textContent = nombreMetodo;

        // Items (Priorizar detalle oficial del servidor, luego respaldo local)
        let items = [];
        if (data.items_detalle && Array.isArray(data.items_detalle) && data.items_detalle.length > 0) {
            items = data.items_detalle;
        } else if (data.items && Array.isArray(data.items)) {
            items = data.items;
        }
        const tbody = document.getElementById('detalleProductos');
        if (tbody) {
            tbody.innerHTML = items.map(it => `
                <tr>
                    <td class="ps-4">
                        <div class="fw-bold text-dark">${it.nombre || 'Producto'}</div>
                        ${it.extra_key ? `<small class="text-muted d-block">${it.extra_key}</small>` : ''}
                    </td>
                    <td class="text-center">${it.cantidad || 0}</td>
                    <td class="text-end">${S(it.precio_unitario || 0)}</td>
                    <td class="text-end pe-4 fw-bold text-primary">${S((it.precio_unitario || 0) * (it.cantidad || 0))}</td>
                </tr>`).join('');
        }

        // Totales
        const total = Number(data.total || 0);
        const subtotal = Number(data.subtotal || total / 1.18);
        const igv = Number(data.igv || total - subtotal);

        document.getElementById('subtotalComprobante').textContent = S(subtotal);
        document.getElementById('igvComprobante').textContent = S(igv);
        document.getElementById('totalComprobante').textContent = S(total);
    }

    // Inicialización
    loadComprobanteData();

    // Eventos
    const btnDescargar = document.getElementById('btnDescargar');
    if (btnDescargar) {
        btnDescargar.addEventListener('click', () => {
            window.print();
        });
    }
})();