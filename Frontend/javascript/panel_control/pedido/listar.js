(function () {
    const API_URL = '/api/panel/pedidos';
    let paginaActual = 1;
    let filtrosActuales = {};

    // Obtener token
    function getToken() {
        return localStorage.getItem('panelToken') || localStorage.getItem('token') || localStorage.getItem('token_panel');
    }

    // Cargar pedidos
    async function cargarPedidos(pagina = 1, filtros = {}) {
        try {
            const token = getToken();
            if (!token) {
                console.error('No hay token de autenticación');
                mostrarError('Sesión no válida. Por favor, inicie sesión nuevamente.');
                return;
            }

            const params = new URLSearchParams({
                page: pagina,
                limit: 20,
                ...filtros
            });

            const response = await fetch(`${API_URL}?${params}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                if (response.status === 401) {
                    console.error('Token inválido o expirado');
                    mostrarError('Sesión expirada. Por favor, inicie sesión nuevamente.');
                    return;
                }
                throw new Error('Error al cargar pedidos');
            }

            const data = await response.json();

            if (data.success) {
                renderizarPedidos(data.pedidos);
                renderizarPaginacion(data.page, data.totalPages);
            }

        } catch (error) {
            console.error('Error:', error);
            mostrarError('Error al cargar los pedidos');
        }
    }

    // Renderizar pedidos en la tabla
    function renderizarPedidos(pedidos) {
        const tbody = document.getElementById('tablaPedidos');

        if (!pedidos || pedidos.length === 0) {
            tbody.innerHTML = `
        <tr>
          <td colspan="8" class="text-center text-muted">
            <i class="fas fa-inbox fa-3x mb-2"></i>
            <p>No se encontraron pedidos</p>
          </td>
        </tr>
      `;
            return;
        }

        tbody.innerHTML = pedidos.map(pedido => `
      <tr>
        <td><strong>#${pedido.id_pedido}</strong></td>
        <td>${formatearFecha(pedido.fecha_pedido)}</td>
        <td>${pedido.nombre_cliente}</td>
        <td>${pedido.email}</td>
        <td><strong>S/ ${parseFloat(pedido.total).toFixed(2)}</strong></td>
        <td>${renderizarBadgeEstado(pedido.estado)}</td>
        <td>
          ${pedido.numero_comprobante ? `
            <span class="badge bg-info">
              ${pedido.tipo_comprobante}: ${pedido.numero_comprobante}
            </span>
          ` : '-'}
        </td>
        <td>
          <button class="btn btn-sm btn-primary me-1" onclick="verDetalle(${pedido.id_pedido})" title="Ver detalle">
            <i class="fas fa-eye"></i>
          </button>
          <button class="btn btn-sm btn-warning" onclick="cambiarEstado(${pedido.id_pedido}, '${pedido.estado}')" title="Cambiar estado">
            <i class="fas fa-edit"></i>
          </button>
        </td>
      </tr>
    `).join('');
    }

    // Renderizar badge de estado
    function renderizarBadgeEstado(estado) {
        const badges = {
            'Pendiente': 'bg-warning text-dark',
            'Entregado': 'bg-success',
            'Cancelado': 'bg-danger'
        };

        return `<span class="badge ${badges[estado] || 'bg-secondary'}">${estado}</span>`;
    }

    // Formatear fecha
    function formatearFecha(fecha) {
        if (!fecha) return '-';
        const date = new Date(fecha);
        return date.toLocaleDateString('es-PE', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
    }

    // Renderizar paginación
    function renderizarPaginacion(paginaActual, totalPaginas) {
        const paginacion = document.getElementById('paginacion');

        if (totalPaginas <= 1) {
            paginacion.innerHTML = '';
            return;
        }

        let html = '';

        // Botón anterior
        html += `
      <li class="page-item ${paginaActual === 1 ? 'disabled' : ''}">
        <a class="page-link" href="#" onclick="cambiarPagina(${paginaActual - 1}); return false;">
          <i class="fas fa-chevron-left"></i>
        </a>
      </li>
    `;

        // Páginas
        for (let i = 1; i <= totalPaginas; i++) {
            if (i === 1 || i === totalPaginas || (i >= paginaActual - 2 && i <= paginaActual + 2)) {
                html += `
          <li class="page-item ${i === paginaActual ? 'active' : ''}">
            <a class="page-link" href="#" onclick="cambiarPagina(${i}); return false;">${i}</a>
          </li>
        `;
            } else if (i === paginaActual - 3 || i === paginaActual + 3) {
                html += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
            }
        }

        // Botón siguiente
        html += `
      <li class="page-item ${paginaActual === totalPaginas ? 'disabled' : ''}">
        <a class="page-link" href="#" onclick="cambiarPagina(${paginaActual + 1}); return false;">
          <i class="fas fa-chevron-right"></i>
        </a>
      </li>
    `;

        paginacion.innerHTML = html;
    }

    // Cambiar página
    window.cambiarPagina = function (pagina) {
        paginaActual = pagina;
        cargarPedidos(pagina, filtrosActuales);
    };

    // Ver detalle del pedido
    window.verDetalle = function (idPedido) {
        // Cambiar el hash y cargar la vista de detalle
        window.location.hash = `/pedidos/${idPedido}`;
        // Llamar directamente a loadPedidos que detectará el hash y cargará el detalle
        if (window.panelControl) {
            window.panelControl.loadPedidos();
        }
    };

    // Cambiar estado del pedido
    window.cambiarEstado = function (idPedido, estadoActual) {
        document.getElementById('modalPedidoId').textContent = idPedido;
        document.getElementById('nuevoEstado').value = estadoActual;

        const modal = new bootstrap.Modal(document.getElementById('modalCambiarEstado'));
        modal.show();

        // Guardar el ID del pedido para usarlo al confirmar
        document.getElementById('btnConfirmarCambio').dataset.pedidoId = idPedido;
    };

    // Confirmar cambio de estado
    async function confirmarCambioEstado() {
        const idPedido = document.getElementById('btnConfirmarCambio').dataset.pedidoId;
        const nuevoEstado = document.getElementById('nuevoEstado').value;

        try {
            const token = getToken();
            const response = await fetch(`${API_URL}/${idPedido}/estado`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ estado: nuevoEstado })
            });

            const data = await response.json();

            if (data.success) {
                // Cerrar modal
                bootstrap.Modal.getInstance(document.getElementById('modalCambiarEstado')).hide();

                // Mostrar mensaje de éxito
                mostrarExito('Estado actualizado correctamente');

                // Recargar pedidos
                cargarPedidos(paginaActual, filtrosActuales);
            } else {
                mostrarError(data.message || 'Error al actualizar el estado');
            }

        } catch (error) {
            console.error('Error:', error);
            mostrarError('Error al actualizar el estado del pedido');
        }
    }

    // Aplicar filtros
    function aplicarFiltros() {
        const estado = document.getElementById('filtroEstado').value;
        const fechaInicio = document.getElementById('fechaInicio').value;
        const fechaFin = document.getElementById('fechaFin').value;

        filtrosActuales = {};

        if (estado) filtrosActuales.estado = estado;
        if (fechaInicio) filtrosActuales.fecha_inicio = fechaInicio;
        if (fechaFin) filtrosActuales.fecha_fin = fechaFin;

        paginaActual = 1;
        cargarPedidos(1, filtrosActuales);
    }

    // Limpiar filtros
    function limpiarFiltros() {
        document.getElementById('filtroEstado').value = '';
        document.getElementById('fechaInicio').value = '';
        document.getElementById('fechaFin').value = '';

        filtrosActuales = {};
        paginaActual = 1;
        cargarPedidos(1, {});
    }

    // Mostrar mensajes
    function mostrarExito(mensaje) {
        // Implementar con Swal o alert
        if (typeof Swal !== 'undefined') {
            Swal.fire('¡Éxito!', mensaje, 'success');
        } else {
            alert(mensaje);
        }
    }

    function mostrarError(mensaje) {
        if (typeof Swal !== 'undefined') {
            Swal.fire('Error', mensaje, 'error');
        } else {
            alert(mensaje);
        }
    }

    // Inicialización - ejecutar inmediatamente ya que el HTML se carga dinámicamente
    function init() {
        console.log('📦 Inicializando gestión de pedidos...');

        // Verificar que existan los elementos necesarios
        if (!document.getElementById('tablaPedidos')) {
            console.error('No se encontró el elemento tablaPedidos');
            return;
        }

        // Cargar pedidos inicialmente
        cargarPedidos();

        // Botones de filtros
        const btnFiltrar = document.getElementById('btnFiltrar');
        const btnLimpiar = document.getElementById('btnLimpiar');
        const btnConfirmarCambio = document.getElementById('btnConfirmarCambio');

        if (btnFiltrar) btnFiltrar.addEventListener('click', aplicarFiltros);
        if (btnLimpiar) btnLimpiar.addEventListener('click', limpiarFiltros);
        if (btnConfirmarCambio) btnConfirmarCambio.addEventListener('click', confirmarCambioEstado);
    }

    // Ejecutar inmediatamente (el HTML ya está cargado cuando se importa este script)
    init();

})();
