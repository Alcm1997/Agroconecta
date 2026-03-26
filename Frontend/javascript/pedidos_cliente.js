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

      const html = generarHTMLComprobante(comprobante, pedido);
      abrirVentanaComprobante(html);

    } catch (err) {
      console.error(err);
      alert('Error al cargar el comprobante: ' + err.message);
    }
  };

  function generarHTMLComprobante(comp, pedido) {
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

    const esBoleta = (comp.tipo_comprobante || '').toLowerCase().includes('boleta');
    const colorPrincipal = '#2E7D32';

    return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>${comp.tipo_comprobante} ${comp.numero_comprobante}</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box;}
  body{font-family:Arial,sans-serif;font-size:12px;color:#1a1a1a;padding:28px;}
  .header{display:flex;justify-content:space-between;align-items:flex-start;
          border-bottom:3px solid ${colorPrincipal};padding-bottom:14px;margin-bottom:16px;}
  .empresa-nombre{font-size:22px;font-weight:bold;color:${colorPrincipal};}
  .empresa-sub{font-size:11px;color:#555;margin-top:3px;}
  .comp-titulo{text-align:right;}
  .comp-titulo h2{font-size:18px;font-weight:bold;color:${colorPrincipal};}
  .badge-comp{background:${colorPrincipal};color:#fff;padding:4px 14px;
              border-radius:20px;font-size:13px;font-weight:bold;display:inline-block;margin-top:4px;}
  .info-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:16px;}
  .info-box{border:1px solid #d4edda;border-radius:8px;padding:12px;background:#f9fff9;}
  .info-box h4{font-size:11px;color:${colorPrincipal};font-weight:bold;text-transform:uppercase;
               letter-spacing:.5px;margin-bottom:8px;border-bottom:1px solid #d4edda;padding-bottom:5px;}
  .info-row{display:flex;margin-bottom:5px;}
  .info-label{font-weight:bold;width:130px;flex-shrink:0;color:#333;}
  .info-value{color:#111;}
  .section-title{font-size:13px;font-weight:bold;color:${colorPrincipal};margin:14px 0 8px;
                 padding-bottom:5px;border-bottom:2px solid #d4edda;}
  table{width:100%;border-collapse:collapse;margin-bottom:16px;}
  thead{background:${colorPrincipal};color:#fff;}
  thead th{padding:7px 10px;text-align:left;font-size:11px;font-weight:bold;}
  tbody tr:nth-child(even){background:#f5fdf5;}
  tbody td{padding:6px 10px;border-bottom:1px solid #e8f5e9;vertical-align:middle;}
  tfoot td{padding:7px 10px;font-weight:bold;background:#e8f5e9;}
  .totales{margin-left:auto;width:280px;margin-bottom:20px;}
  .totales table{margin:0;}
  .totales td{padding:5px 10px;border:none;background:transparent;}
  .totales tr.total-final td{font-size:14px;font-weight:bold;color:${colorPrincipal};
                              border-top:2px solid ${colorPrincipal};}
  .doc-footer{margin-top:20px;border-top:1px solid #ccc;padding-top:8px;
              font-size:10px;color:#888;text-align:center;}
  .gracias{text-align:center;margin:16px 0;padding:12px;background:#f0faf0;
           border-radius:8px;color:${colorPrincipal};font-weight:bold;font-size:13px;}
  .btn-actions{display:flex;gap:10px;margin-bottom:20px;}
  .btn-actions button{padding:8px 20px;border:none;border-radius:6px;cursor:pointer;
                      font-size:13px;font-weight:bold;}
  .btn-print{background:${colorPrincipal};color:#fff;}
  .btn-pdf{background:#e53935;color:#fff;}
  @media print{.btn-actions{display:none!important;}}
</style>
</head>
<body>
  <div class="btn-actions">
    <button class="btn-print" onclick="window.print()">🖨️ Imprimir</button>
    <button class="btn-pdf" onclick="window.print()">📄 Guardar PDF</button>
  </div>

  <div class="header">
    <div>
      <div class="empresa-nombre">🌱 AgroConecta</div>
      <div class="empresa-sub">Pitahaya Perú S.A.C. | RUC: 20XXXXXXXXX</div>
      <div class="empresa-sub">Asc. Popular Lomas De Ancón Mz. 44 Lote 24, Lima</div>
    </div>
    <div class="comp-titulo">
      <h2>${(comp.tipo_comprobante || '').toUpperCase()}</h2>
      <div class="badge-comp">${comp.numero_comprobante}</div>
      <p style="margin-top:6px;font-size:11px;color:#555;">
        Emisión: <strong>${fmt(comp.fecha_emision)}</strong>
      </p>
    </div>
  </div>

  <div class="info-grid">
    <div class="info-box">
      <h4>👤 Datos del Cliente</h4>
      <div class="info-row"><span class="info-label">Nombre:</span><span class="info-value"><strong>${pedido.nombre_cliente || '-'}</strong></span></div>
      <div class="info-row"><span class="info-label">Tipo:</span><span class="info-value">${pedido.tipo_cliente || '-'}</span></div>
      <div class="info-row"><span class="info-label">Documento:</span><span class="info-value">${pedido.numero_documento || '-'}</span></div>
      <div class="info-row"><span class="info-label">Email:</span><span class="info-value">${pedido.email || '-'}</span></div>
    </div>
    <div class="info-box">
      <h4>📋 Datos del Pedido</h4>
      <div class="info-row"><span class="info-label">Pedido N.°:</span><span class="info-value">#${pedido.id_pedido}</span></div>
      <div class="info-row"><span class="info-label">Fecha Pedido:</span><span class="info-value">${fmt(pedido.fecha_pedido)}</span></div>
      <div class="info-row"><span class="info-label">Tipo de Pago:</span><span class="info-value">${pedido.tipo_pago || '-'}</span></div>
      <div class="info-row"><span class="info-label">Estado:</span><span class="info-value">${pedido.estado || '-'}</span></div>
    </div>
  </div>

  <div class="section-title">🛒 Detalle de Productos</div>
  <table>
    <thead>
      <tr>
        <th>Producto</th>
        <th style="text-align:center;width:70px;">Cant.</th>
        <th style="width:80px;">Unidad</th>
        <th style="text-align:right;width:110px;">Precio Unit.</th>
        <th style="text-align:right;width:110px;">Subtotal</th>
      </tr>
    </thead>
    <tbody>${filas}</tbody>
  </table>

  <div class="totales">
    <table>
      <tr><td>Subtotal (sin IGV):</td><td style="text-align:right;">S/ ${parseFloat(comp.subtotal).toFixed(2)}</td></tr>
      <tr><td>IGV (18%):</td><td style="text-align:right;">S/ ${parseFloat(comp.igv).toFixed(2)}</td></tr>
      <tr class="total-final"><td>TOTAL:</td><td style="text-align:right;">S/ ${parseFloat(comp.total_pago).toFixed(2)}</td></tr>
    </table>
  </div>

  <div class="gracias">¡Gracias por tu compra! 🌱 AgroConecta — Pitahaya Perú</div>

  <div class="doc-footer">
    ${comp.tipo_comprobante} N.° ${comp.numero_comprobante} &bull;
    Emitido el ${fmt(comp.fecha_emision)} &bull;
    Documento generado por AgroConecta
  </div>
</body>
</html>`;
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

      // Mostrar modal con detalle
      const modalHtml = `
        <div class="modal fade" id="modalDetallePedido" tabindex="-1">
          <div class="modal-dialog modal-lg">
            <div class="modal-content">
              <div class="modal-header">
                <h5 class="modal-title">Detalle del Pedido #${pedido.id_pedido}</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
              </div>
              <div class="modal-body">
                <div class="row mb-3">
                  <div class="col-md-6">
                    <strong>Fecha:</strong> ${new Date(pedido.fecha_pedido).toLocaleDateString('es-ES')}
                  </div>
                  <div class="col-md-6">
                    <strong>Estado:</strong> ${getEstadoBadge(pedido.estado)}
                  </div>
                </div>
                <div class="row mb-3">
                  <div class="col-md-6">
                    <strong>Tipo de Pago:</strong> ${pedido.tipo_pago || '-'}
                  </div>
                  <div class="col-md-6">
                    <strong>Total:</strong> <span class="text-success fw-bold">${S(pedido.total)}</span>
                  </div>
                </div>
                <h6 class="mt-4">Productos:</h6>
                <div class="table-responsive">
                  <table class="table table-sm">
                    <thead>
                      <tr>
                        <th>Producto</th>
                        <th>Cantidad</th>
                        <th>Precio Unit.</th>
                        <th>Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${(pedido.items || []).map(item => `
                        <tr>
                          <td>${item.nombre_producto}</td>
                          <td>${item.cantidad}</td>
                          <td>${S(item.precio_unitario)}</td>
                          <td>${S(item.subtotal)}</td>
                        </tr>
                      `).join('')}
                    </tbody>
                  </table>
                </div>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
              </div>
            </div>
          </div>
        </div>
      `;

      // Eliminar modal anterior si existe
      const oldModal = document.getElementById('modalDetallePedido');
      if (oldModal) oldModal.remove();

      // Agregar nuevo modal
      document.body.insertAdjacentHTML('beforeend', modalHtml);

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
  document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('pedidosContainer')) {
      cargarPedidos();
    }
  });

  // Exponer función globalmente
  window.cargarPedidos = cargarPedidos;

})();
