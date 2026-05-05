// Sistema de seguimiento de pedidos para clientes
(function () {

  const S = v => `S/ ${Number(v || 0).toFixed(2)}`;

  // Obtener token
  function getToken() {
    return localStorage.getItem('token') || '';
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
      const pedidos = data.pedidos || [];

      if (pedidos.length === 0) {
        container.innerHTML = `
          <div class="alert alert-info">
            <i class="fas fa-info-circle me-2"></i>
            No tienes pedidos registrados aún.
          </div>
        `;
        return;
      }

      renderPedidos(pedidos);
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

  // Renderizar pedidos
  function renderPedidos(pedidos) {
    const container = document.getElementById('pedidosContainer');

    container.innerHTML = `
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
            <button class="btn btn-sm btn-outline-primary" onclick="verComprobante(${pedido.id_pedido})">
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

  // Obtener badge de estado
  function getEstadoBadge(estado) {
    const badges = {
      'Pendiente': '<span class="badge bg-warning text-dark">Pendiente</span>',
      'Entregado': '<span class="badge bg-success">Entregado</span>',
      'Cancelado': '<span class="badge bg-danger">Cancelado</span>'
    };
    return badges[estado] || `<span class="badge bg-secondary">${estado}</span>`;
  }

  // Ver comprobante: obtiene datos y abre ventana de impresión profesional
  window.verComprobante = async function (idPedido) {
    const token = getToken();
    try {
      // Obtener datos del comprobante y del pedido en paralelo
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


  // Ver detalle del pedido
  window.verDetallePedido = async function (idPedido) {
    try {
      const token = getToken();
      const response = await fetch(`/api/client/pedidos/${idPedido}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Error al cargar detalle');

      const data = await response.json();
      const pedido = data.pedido;

      // Poblar el modal estático
      document.getElementById('detalleModalTitle').textContent = `Detalle del Pedido #${pedido.id_pedido}`;
      document.getElementById('detalleFecha').textContent = new Date(pedido.fecha_pedido).toLocaleDateString('es-ES');
      document.getElementById('detalleEstado').innerHTML = getEstadoBadge(pedido.estado);
      document.getElementById('detalleTipoPago').textContent = pedido.tipo_pago || '-';
      document.getElementById('detalleTotal').textContent = S(pedido.total);

      const tbody = document.getElementById('detalleProductosBody');
      tbody.innerHTML = (pedido.items || []).map(item => `
        <tr>
          <td>${item.nombre_producto}</td>
          <td>${item.cantidad}</td>
          <td>${S(item.precio_unitario)}</td>
          <td>${S(item.subtotal)}</td>
        </tr>
      `).join('');

      // Mostrar modal
      const modal = new bootstrap.Modal(document.getElementById('modalDetallePedido'));
      modal.show();

    } catch (error) {
      console.error('Error:', error);
      alert('Error al cargar el detalle del pedido');
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
        cargarPedidos(); // Recargar lista
      } else {
        alert(data.message || 'Error al cancelar el pedido');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al cancelar el pedido');
    }
  };

  // Inicializar al cargar la página
  // Función de inicialización
  const initPedidos = () => {
    if (document.getElementById('pedidosContainer')) {
      cargarPedidos();
    }
  };

  // Ejecutar inicialización si el DOM ya cargó (SPA) o esperar a que cargue
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPedidos);
  } else {
    initPedidos();
  }

  // Exponer función globalmente
  window.cargarPedidos = cargarPedidos;

})();
