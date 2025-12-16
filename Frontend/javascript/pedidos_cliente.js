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

    // Ver comprobante
    window.verComprobante = function (idPedido) {
        const token = getToken();
        window.open(`/api/client/pedidos/${idPedido}/comprobante?token=${token}`, '_blank');
    };

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
