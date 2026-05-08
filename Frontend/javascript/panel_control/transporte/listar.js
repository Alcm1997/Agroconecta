// ========== GESTIÓN DE TRANSPORTE ==========
// Módulo extraído de: html/panel_control/transporte/listar.html
// Patrón: igual que producto/listar.js, cliente/listar.js, etc.

(function () {
    const API_BASE = '/api/panel/transporte';
    let transportistasData = [];
    let vehiculosData = [];

    // Token
    function getToken() {
        return localStorage.getItem('panelToken') || localStorage.getItem('token');
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text || '';
        return div.innerHTML;
    }

    // ========== TRANSPORTISTAS ==========
    async function cargarTransportistas() {
        const tbody = document.getElementById('listaTransportistas');
        if (!tbody) return;
        tbody.innerHTML = '<tr><td colspan="5" class="text-center py-4"><i class="fas fa-spinner fa-spin me-2"></i>Cargando...</td></tr>';

        try {
            const response = await fetch(`${API_BASE}/transportistas`, {
                headers: { 'Authorization': `Bearer ${getToken()}` }
            });
            const data = await response.json();
            transportistasData = data.transportistas || [];

            if (transportistasData.length === 0) {
                tbody.innerHTML = '<tr><td colspan="5" class="text-center py-4 text-muted">No hay transportistas registrados</td></tr>';
                return;
            }

            tbody.innerHTML = transportistasData.map(t => `
            <tr>
                <td><strong>${t.id_transportista}</strong></td>
                <td>${escapeHtml(t.razon_social)}</td>
                <td><code>${t.ruc}</code></td>
                <td><span class="badge bg-info">${t.cantidad_vehiculos || 0}</span></td>
                <td>
                    <div class="btn-group btn-group-sm">
                        <button class="btn btn-outline-primary" onclick="editarTransportista(${t.id_transportista})" title="Editar">
                            <i class="fas fa-edit"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
        } catch (error) {
            console.error('Error:', error);
            tbody.innerHTML = '<tr><td colspan="5" class="text-center text-danger">Error al cargar</td></tr>';
        }
    }

    function mostrarModalTransportista(id = null) {
        document.getElementById('transportistaId').value = '';
        document.getElementById('razonSocial').value = '';
        document.getElementById('ruc').value = '';
        document.getElementById('modalTransportistaTitle').innerHTML = '<i class="fas fa-building me-2"></i>Nuevo Transportista';

        if (id) {
            const t = transportistasData.find(x => x.id_transportista === id);
            if (t) {
                document.getElementById('transportistaId').value = t.id_transportista;
                document.getElementById('razonSocial').value = t.razon_social;
                document.getElementById('ruc').value = t.ruc;
                document.getElementById('modalTransportistaTitle').innerHTML = '<i class="fas fa-edit me-2"></i>Editar Transportista';
            }
        }

        new bootstrap.Modal(document.getElementById('modalTransportista')).show();
    }

    function editarTransportista(id) {
        mostrarModalTransportista(id);
    }

    async function guardarTransportista() {
        const id = document.getElementById('transportistaId').value;
        const razon_social = document.getElementById('razonSocial').value.trim();
        const ruc = document.getElementById('ruc').value.trim();

        if (!razon_social || razon_social.length < 3) {
            Swal.fire('Error', 'La razón social debe tener al menos 3 caracteres', 'error');
            return;
        }

        if (!/^\d{11}$/.test(ruc)) {
            Swal.fire('Error', 'El RUC debe tener 11 dígitos', 'error');
            return;
        }

        try {
            const url = id ? `${API_BASE}/transportistas/${id}` : `${API_BASE}/transportistas`;
            const method = id ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Authorization': `Bearer ${getToken()}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ razon_social, ruc })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Error al guardar');
            }

            bootstrap.Modal.getInstance(document.getElementById('modalTransportista')).hide();
            Swal.fire('¡Éxito!', data.message, 'success');
            cargarTransportistas();
        } catch (error) {
            Swal.fire('Error', error.message, 'error');
        }
    }

    async function eliminarTransportista(id) {
        const result = await Swal.fire({
            title: '¿Eliminar transportista?',
            text: 'Esta acción no se puede deshacer',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            confirmButtonText: 'Sí, eliminar'
        });

        if (!result.isConfirmed) return;

        try {
            const response = await fetch(`${API_BASE}/transportistas/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${getToken()}` }
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Error al eliminar');
            }

            Swal.fire('Eliminado', 'Transportista eliminado correctamente', 'success');
            cargarTransportistas();
        } catch (error) {
            Swal.fire('Error', error.message, 'error');
        }
    }

    // ========== VEHÍCULOS ==========
    async function cargarVehiculos() {
        const tbody = document.getElementById('listaVehiculos');
        if (!tbody) return;
        tbody.innerHTML = '<tr><td colspan="4" class="text-center py-4"><i class="fas fa-spinner fa-spin me-2"></i>Cargando...</td></tr>';

        try {
            const response = await fetch(`${API_BASE}/vehiculos`, {
                headers: { 'Authorization': `Bearer ${getToken()}` }
            });
            const data = await response.json();
            vehiculosData = data.vehiculos || [];

            if (vehiculosData.length === 0) {
                tbody.innerHTML = '<tr><td colspan="4" class="text-center py-4 text-muted">No hay vehículos registrados</td></tr>';
                return;
            }

            tbody.innerHTML = vehiculosData.map(v => `
            <tr>
                <td><strong>${v.id_vehiculo}</strong></td>
                <td><code style="font-size: 1.1em;">${escapeHtml(v.placa)}</code></td>
                <td>${escapeHtml(v.transportista_nombre)}</td>
                <td>
                    <div class="btn-group btn-group-sm">
                        <button class="btn btn-outline-primary" onclick="editarVehiculo(${v.id_vehiculo})" title="Editar">
                            <i class="fas fa-edit"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
        } catch (error) {
            console.error('Error:', error);
            tbody.innerHTML = '<tr><td colspan="4" class="text-center text-danger">Error al cargar</td></tr>';
        }
    }

    async function cargarSelectTransportistas() {
        const select = document.getElementById('vehiculoTransportista');
        if (!select) return;
        select.innerHTML = '<option value="">Cargando...</option>';

        try {
            const response = await fetch(`${API_BASE}/transportistas`, {
                headers: { 'Authorization': `Bearer ${getToken()}` }
            });
            const data = await response.json();
            const transportistas = data.transportistas || [];

            select.innerHTML = '<option value="">Seleccione transportista...</option>' +
                transportistas.map(t => `<option value="${t.id_transportista}">${escapeHtml(t.razon_social)} (${t.ruc})</option>`).join('');
        } catch (error) {
            select.innerHTML = '<option value="">Error al cargar</option>';
        }
    }

    function mostrarModalVehiculo(id = null) {
        document.getElementById('vehiculoId').value = '';
        document.getElementById('placa').value = '';
        document.getElementById('modalVehiculoTitle').innerHTML = '<i class="fas fa-truck me-2"></i>Nuevo Vehículo';

        cargarSelectTransportistas().then(() => {
            if (id) {
                const v = vehiculosData.find(x => x.id_vehiculo === id);
                if (v) {
                    document.getElementById('vehiculoId').value = v.id_vehiculo;
                    document.getElementById('vehiculoTransportista').value = v.id_transportista;
                    document.getElementById('placa').value = v.placa;
                    document.getElementById('modalVehiculoTitle').innerHTML = '<i class="fas fa-edit me-2"></i>Editar Vehículo';
                }
            }
        });

        new bootstrap.Modal(document.getElementById('modalVehiculo')).show();
    }

    function editarVehiculo(id) {
        mostrarModalVehiculo(id);
    }

    async function guardarVehiculo() {
        const id = document.getElementById('vehiculoId').value;
        const id_transportista = document.getElementById('vehiculoTransportista').value;
        const placa = document.getElementById('placa').value.trim().toUpperCase();

        if (!id_transportista) {
            Swal.fire('Error', 'Seleccione un transportista', 'error');
            return;
        }

        if (!placa || placa.length < 5) {
            Swal.fire('Error', 'La placa debe tener al menos 5 caracteres', 'error');
            return;
        }

        try {
            const url = id ? `${API_BASE}/vehiculos/${id}` : `${API_BASE}/vehiculos`;
            const method = id ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Authorization': `Bearer ${getToken()}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ id_transportista, placa })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Error al guardar');
            }

            bootstrap.Modal.getInstance(document.getElementById('modalVehiculo')).hide();
            Swal.fire('¡Éxito!', data.message, 'success');
            cargarVehiculos();
            cargarTransportistas(); // Actualizar count de vehículos
        } catch (error) {
            Swal.fire('Error', error.message, 'error');
        }
    }

    async function eliminarVehiculo(id) {
        const result = await Swal.fire({
            title: '¿Eliminar vehículo?',
            text: 'Esta acción no se puede deshacer',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            confirmButtonText: 'Sí, eliminar'
        });

        if (!result.isConfirmed) return;

        try {
            const response = await fetch(`${API_BASE}/vehiculos/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${getToken()}` }
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Error al eliminar');
            }

            Swal.fire('Eliminado', 'Vehículo eliminado correctamente', 'success');
            cargarVehiculos();
            cargarTransportistas();
        } catch (error) {
            Swal.fire('Error', error.message, 'error');
        }
    }

    // ========== EXPONER GLOBALMENTE (requerido por onclick del HTML) ==========
    window.mostrarModalTransportista = mostrarModalTransportista;
    window.editarTransportista = editarTransportista;
    window.guardarTransportista = guardarTransportista;
    window.eliminarTransportista = eliminarTransportista;
    window.mostrarModalVehiculo = mostrarModalVehiculo;
    window.editarVehiculo = editarVehiculo;
    window.guardarVehiculo = guardarVehiculo;
    window.eliminarVehiculo = eliminarVehiculo;
    window.cargarTransportistas = cargarTransportistas;

    // ========== INIT — llamado por menu.js tras importar el módulo ==========
    window.initTransporteListado = function () {
        const vehiculosTab = document.getElementById('vehiculos-tab');
        if (vehiculosTab) {
            vehiculosTab.addEventListener('shown.bs.tab', cargarVehiculos);
            vehiculosTab.addEventListener('click', () => setTimeout(cargarVehiculos, 50));
        }
        cargarTransportistas();
        cargarVehiculos();
    };

})();
