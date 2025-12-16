(function () {
    const API_URL = '/api/panel/pedidos';
    const API_GUIAS = '/api/panel/guias';
    const API_DEPARTAMENTOS = '/api/departamentos';
    const API_DISTRITOS = '/api/distritos';
    let pedidoActual = null;
    let guiaActual = null;

    // Función global para volver a lista de pedidos
    window.volverAListaPedidos = function () {
        window.location.hash = '/pedidos';
        if (window.panelControl) {
            window.panelControl.loadPedidos();
        }
    };

    // Obtener token
    function getToken() {
        return localStorage.getItem('panelToken') || localStorage.getItem('token') || localStorage.getItem('token_panel');
    }

    // Obtener ID del pedido desde la URL
    function getPedidoId() {
        const hash = window.location.hash;
        const match = hash.match(/\/pedidos\/(\d+)/);
        return match ? parseInt(match[1]) : null;
    }

    // Cargar detalle del pedido
    async function cargarDetalle() {
        const idPedido = getPedidoId();

        if (!idPedido) {
            Swal.fire('Error', 'ID de pedido inválido', 'error');
            window.location.hash = '/pedidos';
            return;
        }

        try {
            const token = getToken();
            if (!token) {
                console.error('No hay token');
                return;
            }

            const response = await fetch(`${API_URL}/${idPedido}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) {
                throw new Error('Error al cargar el pedido');
            }

            const data = await response.json();

            if (data.success) {
                pedidoActual = data.pedido;
                renderizarDetalle(data.pedido);

                // Cargar guía de remisión si existe
                await cargarGuiaRemision(idPedido);
            } else {
                Swal.fire('Error', data.message || 'Error al cargar el pedido', 'error');
                window.location.hash = '/pedidos';
            }

        } catch (error) {
            console.error('Error:', error);
            Swal.fire('Error', 'Error al cargar el detalle del pedido', 'error');
        }
    }

    // Cargar guía de remisión
    async function cargarGuiaRemision(idPedido) {
        try {
            const token = getToken();
            const response = await fetch(`${API_GUIAS}/pedido/${idPedido}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const data = await response.json();

            if (data.success && data.tieneGuia) {
                guiaActual = data.guia;
                mostrarGuiaExistente(data.guia);
            } else {
                // No tiene guía - mostrar botón para generarla (solo si está Pendiente)
                guiaActual = null;
                if (pedidoActual && pedidoActual.estado === 'Pendiente') {
                    document.getElementById('btnGenerarGuia').style.display = 'inline-block';
                }
                document.getElementById('cardGuiaRemision').style.display = 'none';
            }
        } catch (error) {
            console.error('Error al cargar guía:', error);
        }
    }

    // Mostrar guía existente
    function mostrarGuiaExistente(guia) {
        document.getElementById('btnGenerarGuia').style.display = 'none';
        document.getElementById('cardGuiaRemision').style.display = 'block';

        document.getElementById('guiaNumero').textContent = `#${guia.id_guia}`;
        document.getElementById('guiaFechaEnvio').textContent = formatearFecha(guia.fecha_envio);
        document.getElementById('guiaTransportista').textContent = guia.transportista_nombre;
        document.getElementById('guiaRuc').textContent = guia.transportista_ruc;
        document.getElementById('guiaVehiculo').textContent = guia.placa;
        document.getElementById('guiaPuntoPartida').textContent = guia.punto_partida;
        document.getElementById('guiaPuntoLlegada').textContent = guia.punto_llegada;
    }

    // Renderizar detalle del pedido
    function renderizarDetalle(pedido) {
        document.getElementById('pedidoId').textContent = pedido.id_pedido;
        document.getElementById('fechaPedido').textContent = formatearFecha(pedido.fecha_pedido);
        document.getElementById('estadoPedido').innerHTML = renderizarBadgeEstado(pedido.estado);
        document.getElementById('fechaEntrega').textContent = pedido.fecha_entrega ? formatearFecha(pedido.fecha_entrega) : 'Pendiente';
        document.getElementById('tipoPago').textContent = pedido.tipo_pago || '-';
        document.getElementById('totalPedido').textContent = `S/ ${parseFloat(pedido.total).toFixed(2)}`;

        document.getElementById('nombreCliente').textContent = pedido.nombre_cliente;
        document.getElementById('tipoCliente').textContent = pedido.tipo_cliente;
        document.getElementById('documentoCliente').textContent = pedido.numero_documento;
        document.getElementById('emailCliente').textContent = pedido.email;
        document.getElementById('telefonoCliente').textContent = pedido.telefono || '-';
        document.getElementById('direccionCliente').textContent = pedido.direccion || '-';

        renderizarProductos(pedido.items);

        if (pedido.comprobante) {
            renderizarComprobante(pedido.comprobante);
        }
    }

    function renderizarProductos(items) {
        const tbody = document.getElementById('tablaProductos');

        if (!items || items.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center">No hay productos</td></tr>';
            return;
        }

        tbody.innerHTML = items.map(item => `
            <tr>
                <td>${item.nombre_producto}</td>
                <td>${item.categoria || '-'}</td>
                <td>${item.cantidad}</td>
                <td>${item.unidad_medida || '-'}</td>
                <td>S/ ${parseFloat(item.precio_unitario).toFixed(2)}</td>
                <td><strong>S/ ${(item.cantidad * parseFloat(item.precio_unitario)).toFixed(2)}</strong></td>
            </tr>
        `).join('');
    }

    function renderizarComprobante(comprobante) {
        document.getElementById('tipoComprobante').textContent = comprobante.tipo_comprobante;
        document.getElementById('numeroComprobante').textContent = comprobante.numero_comprobante;
        document.getElementById('fechaEmision').textContent = formatearFecha(comprobante.fecha_emision);
        document.getElementById('subtotalComprobante').textContent = `S/ ${parseFloat(comprobante.subtotal).toFixed(2)}`;
        document.getElementById('igvComprobante').textContent = `S/ ${parseFloat(comprobante.igv).toFixed(2)}`;
        document.getElementById('totalComprobante').textContent = `S/ ${parseFloat(comprobante.total_pago).toFixed(2)}`;
    }

    function renderizarBadgeEstado(estado) {
        const badges = {
            'Pendiente': 'bg-warning text-dark',
            'Entregado': 'bg-success',
            'Cancelado': 'bg-danger'
        };
        return `<span class="badge ${badges[estado] || 'bg-secondary'}">${estado}</span>`;
    }

    function formatearFecha(fecha) {
        if (!fecha) return '-';
        return new Date(fecha).toLocaleDateString('es-PE', {
            year: 'numeric', month: '2-digit', day: '2-digit'
        });
    }

    // ========== CAMBIAR ESTADO ==========
    function abrirModalCambiarEstado() {
        if (!pedidoActual) return;
        document.getElementById('nuevoEstado').value = pedidoActual.estado;
        new bootstrap.Modal(document.getElementById('modalCambiarEstado')).show();
    }

    async function confirmarCambioEstado() {
        const nuevoEstado = document.getElementById('nuevoEstado').value;

        try {
            const token = getToken();
            const response = await fetch(`${API_URL}/${pedidoActual.id_pedido}/estado`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ estado: nuevoEstado })
            });

            const data = await response.json();

            if (data.success) {
                bootstrap.Modal.getInstance(document.getElementById('modalCambiarEstado')).hide();
                Swal.fire('¡Éxito!', 'Estado actualizado correctamente', 'success');
                cargarDetalle();
            } else {
                Swal.fire('Error', data.message || 'Error al actualizar el estado', 'error');
            }

        } catch (error) {
            console.error('Error:', error);
            Swal.fire('Error', 'Error al actualizar el estado del pedido', 'error');
        }
    }

    // ========== GUÍA DE REMISIÓN ==========
    async function abrirModalGuiaRemision() {
        if (!pedidoActual) return;

        try {
            const token = getToken();
            const response = await fetch(`${API_GUIAS}/pedido/${pedidoActual.id_pedido}/datos-creacion`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const data = await response.json();

            if (!data.success) {
                Swal.fire('Error', data.message || 'Error al obtener datos', 'error');
                return;
            }

            // Guardar datos del pedido para pre-llenar
            const pedidoData = data.pedido;

            // Llenar info del pedido
            document.getElementById('guiaIdPedido').value = pedidoActual.id_pedido;
            document.getElementById('guiaInfoPedido').textContent = pedidoActual.id_pedido;
            document.getElementById('guiaInfoCliente').textContent = pedidoActual.nombre_cliente;

            // Llenar select de transportistas
            const selTrans = document.getElementById('guiaTransportistaSel');
            selTrans.innerHTML = '<option value="">Seleccione transportista...</option>' +
                data.transportistas.map(t => `<option value="${t.id_transportista}">${t.razon_social} (${t.ruc})</option>`).join('');

            // Llenar select de vehículos
            const selVeh = document.getElementById('guiaVehiculoSel');
            selVeh.innerHTML = '<option value="">Seleccione vehículo...</option>' +
                data.vehiculos.map(v => `<option value="${v.id_vehiculo}" data-transportista="${v.id_transportista}">${v.placa} - ${v.transportista_nombre}</option>`).join('');

            // Cargar departamentos y pre-seleccionar el del cliente
            await cargarDepartamentos();
            if (pedidoData && pedidoData.id_departamento) {
                document.getElementById('guiaDepartamentoSel').value = pedidoData.id_departamento;
                // Cargar distritos y pre-seleccionar el del cliente
                await cargarDistritos(pedidoData.id_departamento);
                if (pedidoData.id_distrito) {
                    document.getElementById('guiaDistritoSel').value = pedidoData.id_distrito;
                }
            }

            // Pre-llenar punto de llegada con dirección completa del cliente
            let direccionCompleta = pedidoActual.direccion || '';
            if (pedidoData && pedidoData.nombre_distrito) {
                direccionCompleta += direccionCompleta ? ` - ${pedidoData.nombre_distrito}` : pedidoData.nombre_distrito;
            }
            if (pedidoData && pedidoData.nombre_departamento) {
                direccionCompleta += direccionCompleta ? ` - ${pedidoData.nombre_departamento}` : pedidoData.nombre_departamento;
            }
            document.getElementById('guiaPuntoLlegadaInput').value = direccionCompleta;

            // Mostrar modal
            new bootstrap.Modal(document.getElementById('modalGuiaRemision')).show();

        } catch (error) {
            console.error('Error:', error);
            Swal.fire('Error', 'Error al cargar datos para la guía', 'error');
        }
    }

    // Cargar departamentos
    async function cargarDepartamentos() {
        try {
            const response = await fetch(API_DEPARTAMENTOS);
            const data = await response.json();

            const select = document.getElementById('guiaDepartamentoSel');
            select.innerHTML = '<option value="">Seleccione departamento...</option>' +
                data.map(d => `<option value="${d.id_departamento}">${d.nombre_departamento}</option>`).join('');
        } catch (error) {
            console.error('Error cargando departamentos:', error);
        }
    }

    // Cargar distritos por departamento
    async function cargarDistritos(idDepartamento) {
        try {
            const response = await fetch(`${API_DISTRITOS}/departamento/${idDepartamento}`);
            const data = await response.json();

            const select = document.getElementById('guiaDistritoSel');
            select.innerHTML = '<option value="">Seleccione distrito...</option>' +
                data.map(d => `<option value="${d.id_distrito}">${d.nombre_distrito}</option>`).join('');
        } catch (error) {
            console.error('Error cargando distritos:', error);
        }
    }

    async function guardarGuiaRemision() {
        const id_pedido = document.getElementById('guiaIdPedido').value;
        const id_transportista = document.getElementById('guiaTransportistaSel').value;
        const id_vehiculo = document.getElementById('guiaVehiculoSel').value;
        const id_departamento = document.getElementById('guiaDepartamentoSel').value || null;
        const id_distrito = document.getElementById('guiaDistritoSel').value || null;
        const punto_partida = document.getElementById('guiaPuntoPartidaInput').value.trim();
        const punto_llegada = document.getElementById('guiaPuntoLlegadaInput').value.trim();

        // Validaciones
        if (!id_transportista) {
            Swal.fire('Error', 'Seleccione un transportista', 'error');
            return;
        }
        if (!id_vehiculo) {
            Swal.fire('Error', 'Seleccione un vehículo', 'error');
            return;
        }
        if (!punto_partida || punto_partida.length < 5) {
            Swal.fire('Error', 'El punto de partida debe tener al menos 5 caracteres', 'error');
            return;
        }
        if (!punto_llegada || punto_llegada.length < 5) {
            Swal.fire('Error', 'El punto de llegada debe tener al menos 5 caracteres', 'error');
            return;
        }

        try {
            const token = getToken();
            const response = await fetch(API_GUIAS, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    id_pedido,
                    id_transportista,
                    id_vehiculo,
                    id_departamento,
                    id_distrito,
                    punto_partida,
                    punto_llegada
                })
            });

            const data = await response.json();

            if (data.success) {
                bootstrap.Modal.getInstance(document.getElementById('modalGuiaRemision')).hide();
                Swal.fire('¡Éxito!', 'Guía de remisión generada exitosamente', 'success');
                cargarDetalle();
            } else {
                Swal.fire('Error', data.message || 'Error al generar la guía', 'error');
            }

        } catch (error) {
            console.error('Error:', error);
            Swal.fire('Error', 'Error al generar la guía de remisión', 'error');
        }
    }

    // ========== INICIALIZACIÓN ==========
    function init() {
        console.log('📋 Inicializando detalle de pedido...');

        cargarDetalle();

        // Event listeners
        const btnCambiarEstado = document.getElementById('btnCambiarEstado');
        const btnConfirmarCambio = document.getElementById('btnConfirmarCambio');
        const btnGenerarGuia = document.getElementById('btnGenerarGuia');
        const btnGuardarGuia = document.getElementById('btnGuardarGuia');

        if (btnCambiarEstado) btnCambiarEstado.addEventListener('click', abrirModalCambiarEstado);
        if (btnConfirmarCambio) btnConfirmarCambio.addEventListener('click', confirmarCambioEstado);
        if (btnGenerarGuia) btnGenerarGuia.addEventListener('click', abrirModalGuiaRemision);
        if (btnGuardarGuia) btnGuardarGuia.addEventListener('click', guardarGuiaRemision);

        // Filtrar vehículos por transportista seleccionado
        const selTrans = document.getElementById('guiaTransportistaSel');
        if (selTrans) {
            selTrans.addEventListener('change', () => {
                const selectedTrans = selTrans.value;
                const options = document.querySelectorAll('#guiaVehiculoSel option');
                options.forEach(opt => {
                    if (opt.value === '') return;
                    const transp = opt.getAttribute('data-transportista');
                    opt.style.display = (!selectedTrans || transp === selectedTrans) ? '' : 'none';
                });
                document.getElementById('guiaVehiculoSel').value = '';
            });
        }

        // Cargar distritos cuando cambia departamento
        const selDep = document.getElementById('guiaDepartamentoSel');
        if (selDep) {
            selDep.addEventListener('change', () => {
                const idDep = selDep.value;
                if (idDep) {
                    cargarDistritos(idDep);
                } else {
                    document.getElementById('guiaDistritoSel').innerHTML = '<option value="">Seleccione distrito...</option>';
                }
            });
        }

        // Limpiar backdrop al cerrar modales
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            modal.addEventListener('hidden.bs.modal', () => {
                // Remover backdrops huérfanos
                const backdrops = document.querySelectorAll('.modal-backdrop');
                backdrops.forEach(backdrop => backdrop.remove());
                // Restaurar scroll del body
                document.body.classList.remove('modal-open');
                document.body.style.overflow = '';
                document.body.style.paddingRight = '';
            });
        });
    }

    // Ejecutar inmediatamente
    init();

})();
