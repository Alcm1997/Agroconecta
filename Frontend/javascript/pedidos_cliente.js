// Sistema de seguimiento de pedidos para clientes
(function () {
  let cachePedidos = []; // Cache para navegación rápida entre lista y detalle

  const S = v => `S/ ${Number(v || 0).toFixed(2)}`;

  // Obtener token (Sincronizado con el resto de la app)
  function getToken() {
    const t = localStorage.getItem('token_cliente') || localStorage.getItem('token') || '';
    return (t || '').replace(/^"|"$/g, '').trim();
  }

  // Cargar pedidos del cliente
  async function cargarPedidos() {
    const container = document.getElementById('pedidosContainer');
    if (!container) return;

    try {
      const token = getToken();
      const response = await fetch('/api/client/pedidos', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error('Error al cargar pedidos');
      }

      const data = await response.json();
      cachePedidos = data.pedidos || [];

      if (cachePedidos.length === 0) {
        container.innerHTML = `
          <div class="alert alert-info">
            <i class="fas fa-info-circle me-2"></i>
            No tienes pedidos registrados aún.
          </div>
        `;
        return;
      }

      renderPedidos(cachePedidos);
    } catch (error) {
      console.error('Error cargando pedidos:', error);
      container.innerHTML = `
        <div class="alert alert-danger">
          <i class="fas fa-exclamation-triangle me-2"></i>
          Error al cargar tus pedidos. Intenta nuevamente.
        </div>
      `;
    }
  }

  // Renderizar pedidos (Lista principal)
  function renderPedidos(pedidos) {
    const container = document.getElementById('pedidosContainer');

    container.innerHTML = `
      <div class="pedidos-card fade-in">
        <div class="table-responsive">
          <table class="table table-hover">
            <thead>
              <tr>
                <th>Pedido #</th>
                <th>Fecha</th>
                <th>Total</th>
                <th>Estado</th>
                <th>Comprobante</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              ${pedidos.map(p => renderPedidoRow(p)).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  // Renderizar fila de pedido
  function renderPedidoRow(pedido) {
    const estadoBadge = getEstadoBadge(pedido.estado);
    const fecha = new Date(pedido.fecha_pedido).toLocaleDateString('es-ES');
    const puedeCancel = pedido.estado === 'Pendiente';

    return `
      <tr>
        <td><strong>#${pedido.id_pedido}</strong></td>
        <td>${fecha}</td>
        <td><strong>${S(pedido.total)}</strong></td>
        <td>${estadoBadge}</td>
        <td>
          ${pedido.numero_comprobante || '-'}
          ${pedido.id_comprobante ? `
            <button class="btn btn-sm btn-outline-primary" title="Ver Comprobante" onclick="verComprobante(${pedido.id_pedido})">
              <i class="fas fa-file-invoice"></i>
            </button>
          ` : ''}
        </td>
        <td>
          <button class="btn btn-sm btn-info" onclick="verDetallePedido(${pedido.id_pedido})">
            <i class="fas fa-eye"></i> Ver
          </button>
          ${puedeCancel ? `
            <button class="btn btn-sm btn-danger" onclick="cancelarPedido(${pedido.id_pedido})">
              <i class="fas fa-times"></i> Cancelar
            </button>
          ` : ''}
        </td>
      </tr>
    `;
  }

  // Renderizar Vista de Detalle (Integrada en la card)
  function renderDetallePedido(pedido) {
    const container = document.getElementById('pedidosContainer');
    const fecha = new Date(pedido.fecha_pedido).toLocaleDateString('es-ES');
    
    container.innerHTML = `
      <div class="pedidos-card fade-in">
        <div class="d-flex justify-content-between align-items-center mb-4 border-bottom pb-3">
          <h5 class="mb-0 text-success">
            <i class="fas fa-receipt me-2"></i>Detalle del Pedido #${pedido.id_pedido}
          </h5>
          <button class="btn btn-sm btn-secondary rounded-pill px-3" onclick="window.cargarPedidosCache()">
            <i class="fas fa-arrow-left me-2"></i>Volver al Historial
          </button>
        </div>

        <div class="row g-3 mb-4">
          <div class="col-md-3">
            <label class="small text-muted d-block">Fecha</label>
            <span class="fw-bold">${fecha}</span>
          </div>
          <div class="col-md-3">
            <label class="small text-muted d-block">Estado</label>
            ${getEstadoBadge(pedido.estado)}
          </div>
          <div class="col-md-3">
            <label class="small text-muted d-block">Método de Pago</label>
            <span class="fw-bold text-uppercase">${pedido.tipo_pago || '-'}</span>
          </div>
          <div class="col-md-3">
            <label class="small text-muted d-block">Total del Pedido</label>
            <span class="fs-5 fw-bold text-success">${S(pedido.total)}</span>
          </div>
        </div>

        <h6 class="mb-3"><i class="fas fa-shopping-basket me-2"></i>Productos solicitados:</h6>
        <div class="table-responsive detail-table-wrapper">
          <table class="table table-sm align-middle">
            <thead class="table-light">
              <tr class="text-nowrap">
                <th>Producto</th>
                <th class="text-center">Cant.</th>
                <th class="text-end">P. Unitario</th>
                <th class="text-end">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              ${(pedido.items || []).map(item => `
                <tr>
                  <td>${item.nombre_producto}</td>
                  <td class="text-center">${item.cantidad}</td>
                  <td class="text-end">${S(item.precio_unitario)}</td>
                  <td class="text-end fw-bold">${S(item.subtotal)}</td>
                </tr>
              `).join('')}
            </tbody>
            <tfoot>
              <tr>
                <td colspan="3" class="text-end fw-bold py-3">TOTAL:</td>
                <td class="text-end fw-bold text-success py-3 fs-5">${S(pedido.total)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    `;
  }

  // Obtener badge de estado
  function getEstadoBadge(estado) {
    const badges = {
      'Pendiente': '<span class="badge bg-warning text-dark">Pendiente</span>',
      'Entregado': '<span class="badge bg-success">Entregado</span>',
      'Cancelado': '<span class="badge bg-danger">Cancelado</span>'
    };
    return badges[estado] || `<span class="badge bg-secondary">${estado}</span>`;
  }

  // Ver comprobante
  window.verComprobante = async function (idPedido) {
    const token = getToken();
    try {
      const [rComp, rPed] = await Promise.all([
        fetch(`/api/client/pedidos/${idPedido}/comprobante`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`/api/client/pedidos/${idPedido}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (!rComp.ok) throw new Error('No se pudo obtener el comprobante');
      if (!rPed.ok) throw new Error('No se pudo obtener el pedido');

      const { comprobante } = await rComp.json();
      const { pedido } = await rPed.json();

      const html = await generarHTMLComprobante(comprobante, pedido);
      abrirVentanaComprobante(html);

    } catch (err) {
      console.error(err);
      alert('Error al cargar el comprobante: ' + err.message);
    }
  };

  async function generarHTMLComprobante(comp, pedido) {
    const fmt = (f) => f ? new Date(f).toLocaleDateString('es-PE', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    }) : '-';

    const filas = (pedido.items || []).map(it => `
            <tr>
                <td>${it.nombre_producto}</td>
                <td style="text-align:center;">${it.cantidad}</td>
                <td>${it.unidad_medida || '-'}</td>
                <td style="text-align:right;">S/ ${parseFloat(it.precio_unitario).toFixed(2)}</td>
                <td style="text-align:right;"><strong>S/ ${parseFloat(it.subtotal || it.cantidad * it.precio_unitario).toFixed(2)}</strong></td>
            </tr>
        `).join('');

    try {
        const resp = await fetch('/html/client/comprobante-template.html');
        if (!resp.ok) throw new Error('No se pudo cargar la plantilla del comprobante.');
        let template = await resp.text();

        template = template
            .replace(/\{\{TIPO_COMPROBANTE\}\}/g, comp.tipo_comprobante || 'Comprobante')
            .replace(/\{\{TIPO_COMPROBANTE_UPPER\}\}/g, (comp.tipo_comprobante || 'Comprobante').toUpperCase())
            .replace(/\{\{NUMERO_COMPROBANTE\}\}/g, comp.numero_comprobante || '-')
            .replace(/\{\{FECHA_EMISION\}\}/g, fmt(comp.fecha_emision))
            .replace(/\{\{NOMBRE_CLIENTE\}\}/g, pedido.nombre_cliente || '-')
            .replace(/\{\{TIPO_CLIENTE\}\}/g, pedido.tipo_cliente || '-')
            .replace(/\{\{NUMERO_DOCUMENTO\}\}/g, pedido.numero_documento || '-')
            .replace(/\{\{EMAIL_CLIENTE\}\}/g, pedido.email || '-')
            .replace(/\{\{ID_PEDIDO\}\}/g, pedido.id_pedido || '-')
            .replace(/\{\{FECHA_PEDIDO\}\}/g, fmt(pedido.fecha_pedido))
            .replace(/\{\{TIPO_PAGO\}\}/g, pedido.tipo_pago || '-')
            .replace(/\{\{ESTADO_PEDIDO\}\}/g, pedido.estado || '-')
            .replace(/\{\{FILAS_PRODUCTOS\}\}/g, filas)
            .replace(/\{\{SUBTOTAL\}\}/g, parseFloat(comp.subtotal || 0).toFixed(2))
            .replace(/\{\{IGV\}\}/g, parseFloat(comp.igv || 0).toFixed(2))
            .replace(/\{\{TOTAL_PAGO\}\}/g, parseFloat(comp.total_pago || 0).toFixed(2));

        return template;
    } catch (err) {
        console.error('Error cargando plantilla HTML:', err);
        return `<h2>Error al generar comprobante</h2><p>${err.message}</p>`;
    }
  }

  function abrirVentanaComprobante(html) {
    const win = window.open('', '_blank', 'width=820,height=680');
    win.document.write(html);
    win.document.close();
    win.focus();
  }


  // Ver detalle del pedido (Ahora In-Place)
  window.verDetallePedido = async function (idPedido) {
    const container = document.getElementById('pedidosContainer');
    
    // Loader temporal mientras llega el detalle
    container.innerHTML = `
      <div class="pedidos-card text-center py-5">
        <div class="spinner-border text-success" role="status"></div>
        <p class="mt-2 text-muted">Cargando detalles del pedido...</p>
      </div>
    `;

    try {
      const token = getToken();
      const response = await fetch(`/api/client/pedidos/${idPedido}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Error al cargar detalle');

      const data = await response.json();
      renderDetallePedido(data.pedido);

    } catch (error) {
      console.error('Error:', error);
      alert('Error al cargar el detalle del pedido');
      renderPedidos(cachePedidos); // Volver a la lista en caso de error
    }
  };

  // Cancelar pedido
  window.cancelarPedido = async function (idPedido) {
    if (!confirm('¿Estás seguro de que deseas cancelar este pedido?')) {
      return;
    }

    try {
      const token = getToken();
      const response = await fetch(`/api/client/pedidos/${idPedido}/cancelar`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (response.ok && data.success) {
        alert('Pedido cancelado exitosamente');
        cargarPedidos(); // Recargar lista completa
      } else {
        alert(data.message || 'Error al cancelar el pedido');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al cancelar el pedido');
    }
  };

  // Exponer función de carga desde cache para el botón volver
  window.cargarPedidosCache = () => {
    renderPedidos(cachePedidos);
  };

  // Inicialización
  const initPedidos = () => {
    if (document.getElementById('pedidosContainer')) {
      cargarPedidos();
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPedidos);
  } else {
    initPedidos();
  }

  window.cargarPedidos = cargarPedidos;

})();
