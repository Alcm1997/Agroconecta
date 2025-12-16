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

  // ✅ CAMBIAR: /api/cliente/me → /api/client/me
  async function obtenerPerfilCliente() {
    const token = getToken();
    if (!token) return null;

    try {
      const response = await fetch('/api/client/me', {  // ← CAMBIO AQUÍ
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

  // Normalizar datos del cliente (natural vs jurídico)
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

  // Cargar datos del comprobante
  async function loadComprobanteData() {
    const pedidoData = localStorage.getItem('ultimo_pedido');
    if (!pedidoData) return renderSinDatos();

    try {
      let data = JSON.parse(pedidoData);
      
      // Obtener perfil completo del cliente desde el backend
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
        <div class="alert alert-warning">
          <h4>No se encontraron datos del comprobante</h4>
          <p>Por favor, realiza un pedido primero.</p>
          <a href="/html/agroconecta.html" class="btn btn-primary">Ir a la tienda</a>
        </div>
      </div>`;
  }

  function renderComprobante(data) {
    // Cliente
    const c = data.cliente || {};
    document.getElementById('nombreCliente').textContent = 
      `${c.nombres || ''} ${c.apellidos || ''}`.trim() || 'Cliente';
    document.getElementById('documentoCliente').textContent = c.numero_documento || '-';
    document.getElementById('telefonoCliente').textContent = c.telefono || '-';
    document.getElementById('emailCliente').textContent = c.email || '-';

    // Encabezado
    document.getElementById('tipoComprobante').textContent = data.tipo_comprobante || 'BOLETA';
    document.getElementById('numeroComprobante').textContent = data.numero_comprobante || '-';

    // Fecha y método
    const fecha = data.fecha_pedido ? new Date(data.fecha_pedido) : new Date();
    document.getElementById('fechaPedido').textContent = fecha.toLocaleDateString('es-PE');
    document.getElementById('horaPedido').textContent = fecha.toLocaleTimeString('es-PE');
    document.getElementById('metodoPago').textContent = data.metodo_pago || '-';

    // Items
    const items = data.items || [];
    const tbody = document.getElementById('detalleProductos');
    tbody.innerHTML = items.map(it => `
      <tr>
        <td>
          <div class="fw-semibold">${it.nombre || 'Producto'}</div>
          ${it.extra_key ? `<small class="text-muted">${it.extra_key}</small>` : ''}
        </td>
        <td class="text-center">${it.cantidad || 0}</td>
        <td class="text-end">${S(it.precio_unitario || 0)}</td>
        <td class="text-end fw-semibold">${S((it.precio_unitario || 0) * (it.cantidad || 0))}</td>
      </tr>`).join('');

    // Totales
    const total = Number(data.total || items.reduce((s, it) => s + (it.precio_unitario || 0) * (it.cantidad || 0), 0));
    const igvRate = 0.18;
    const subtotal = total / (1 + igvRate);
    const igv = total - subtotal;

    document.getElementById('subtotalComprobante').textContent = S(subtotal);
    document.getElementById('igvComprobante').textContent = S(igv);
    document.getElementById('totalComprobante').textContent = S(total);
  }

  function descargarPDF() {
    window.print();
  }

  document.addEventListener('DOMContentLoaded', () => {
    loadComprobanteData();
    const btnDescargar = document.getElementById('btnDescargar');
    if (btnDescargar) btnDescargar.addEventListener('click', descargarPDF);
  });
})();