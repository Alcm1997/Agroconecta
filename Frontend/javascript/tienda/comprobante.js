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

    function numberToWords(num) {
        const units = ['', 'UN', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE'];
        const tens = ['', 'DIEZ', 'VEINTE', 'TREINTA', 'CUARENTA', 'CINCUENTA', 'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA'];
        const specials = ['DIEZ', 'ONCE', 'DOCE', 'TRECE', 'CATORCE', 'QUINCE', 'DIECISEIS', 'DIECISIETE', 'DIECIOCHO', 'DIECINUEVE'];
        const hundreds = ['', 'CIENTO', 'DOSCIENTOS', 'TRESCIENTOS', 'CUATROCIENTOS', 'QUINIENTOS', 'SEISCIENTOS', 'SETECIENTOS', 'OCHOCIENTOS', 'NOVECIENTOS'];

        if (num === 0) return 'CERO';
        if (num === 100) return 'CIEN';

        let words = '';
        if (num >= 100) {
            words += hundreds[Math.floor(num / 100)] + ' ';
            num %= 100;
        }
        if (num >= 20) {
            words += tens[Math.floor(num / 10)] + (num % 10 !== 0 ? ' Y ' + units[num % 10] : '');
        } else if (num >= 10) {
            words += specials[num - 10];
        } else if (num > 0) {
            words += units[num];
        }
        return words.trim();
    }

    function formatTotalWords(total) {
        const integerPart = Math.floor(total);
        const decimalPart = Math.round((total - integerPart) * 100);
        const words = numberToWords(integerPart);
        const cents = decimalPart.toString().padStart(2, '0');
        return `${words} CON ${cents}/100 SOLES`;
    }

    function renderComprobante(data) {
        // Cliente
        const c = data.cliente || {};
        const nombreDisplay = `${c.nombres || ''} ${c.apellidos || ''}`.trim() || 'Cliente';
        
        // Elementos Web
        document.getElementById('nombreCliente').textContent = nombreDisplay;
        document.getElementById('documentoCliente').textContent = c.numero_documento || '-';
        document.getElementById('telefonoCliente').textContent = c.telefono || '-';
        document.getElementById('emailCliente').textContent = c.email || '-';

        // Elementos Impresión (SUNAT)
        const printNombre = document.getElementById('printNombreCliente');
        if (printNombre) printNombre.textContent = nombreDisplay;
        const printDoc = document.getElementById('printDocCliente');
        if (printDoc) printDoc.textContent = c.numero_documento || '-';
        const printDir = document.getElementById('printDireccionCliente');
        if (printDir) printDir.textContent = c.direccion || 'LIMA, PERÚ';

        // Encabezado
        const tipoComp = (data.tipo_comprobante || 'BOLETA').toUpperCase();
        document.getElementById('tipoComprobante').textContent = tipoComp;
        document.getElementById('numeroComprobante').textContent = data.numero_comprobante || 'BO000-000';
        
        const printTipo = document.getElementById('printTipoComprobante');
        if (printTipo) printTipo.textContent = `${tipoComp} DE VENTA ELECTRÓNICA`;
        const printNum = document.getElementById('printNumeroComprobante');
        if (printNum) printNum.textContent = data.numero_comprobante || 'BO000-000';

        // Fecha y método
        const fecha = data.fecha_pedido ? new Date(data.fecha_pedido) : new Date();
        const fStr = fecha.toLocaleDateString('es-PE');
        const hStr = fecha.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        
        document.getElementById('fechaPedido').textContent = fStr;
        document.getElementById('horaPedido').textContent = hStr;
        
        const printFecha = document.getElementById('printFecha');
        if (printFecha) printFecha.textContent = fStr;

        // Priorizar el nombre oficial que viene de la BD o del UI capturado
        const nombreMetodo = data.metodo_pago || data.tipo_pago || 'Pago Online';
        document.getElementById('metodoPago').textContent = nombreMetodo;
        const printMetodo = document.getElementById('printMetodo');
        if (printMetodo) printMetodo.textContent = nombreMetodo;

        // Items (Priorizar detalle oficial del servidor, luego respaldo local)
        let items = [];
        if (data.items_detalle && Array.isArray(data.items_detalle) && data.items_detalle.length > 0) {
            items = data.items_detalle;
        } else if (data.items && Array.isArray(data.items)) {
            items = data.items;
        }

        // Render Web Table
        const tbody = document.getElementById('detalleProductos');
        if (tbody) {
            tbody.innerHTML = items.map(it => `
                <tr>
                    <td class="ps-4">
                        <div class="fw-bold text-dark">${it.nombre || 'Producto'}</div>
                    </td>
                    <td class="text-center">${it.cantidad || 0}</td>
                    <td class="text-end">${S(it.precio_unitario || 0)}</td>
                    <td class="text-end pe-4 fw-bold text-primary">${S((it.precio_unitario || 0) * (it.cantidad || 0))}</td>
                </tr>`).join('');
        }

        // Render Print Table
        const printTbody = document.getElementById('printDetalle');
        if (printTbody) {
            printTbody.innerHTML = items.map(it => `
                <tr>
                    <td style="text-align: center;">${Number(it.cantidad).toFixed(2)}</td>
                    <td>${it.nombre || 'Producto'}</td>
                    <td style="text-align: right;">${Number(it.precio_unitario).toFixed(2)}</td>
                    <td style="text-align: right;">${(Number(it.precio_unitario) * Number(it.cantidad)).toFixed(2)}</td>
                </tr>`).join('');
        }

        // Totales
        const total = Number(data.total || 0);
        const subtotal = Number(data.subtotal || total / 1.18);
        const igv = Number(data.igv || total - subtotal);

        // Web Totals
        document.getElementById('subtotalComprobante').textContent = S(subtotal);
        document.getElementById('igvComprobante').textContent = S(igv);
        document.getElementById('totalComprobante').textContent = S(total);

        // Print Totals
        const pSub = document.getElementById('printSubtotal');
        if (pSub) pSub.textContent = subtotal.toFixed(2);
        const pIgv = document.getElementById('printIgv');
        if (pIgv) pIgv.textContent = igv.toFixed(2);
        const pTotal = document.getElementById('printTotal');
        if (pTotal) pTotal.textContent = S(total);

        // Son: (Monto en letras)
        const totalLetras = document.getElementById('totalLetras');
        if (totalLetras) totalLetras.textContent = formatTotalWords(total);
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