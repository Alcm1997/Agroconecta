// Inicializador global
window.initClientesListado = async function () {
    console.log('🟢 Ejecutando initClientesListado');

    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/panel-login';
        return;
    }

    const tn = document.querySelector('#tablaClientesNaturales tbody');
    const tj = document.querySelector('#tablaClientesJuridicos tbody');

    // Esperar si aún no se inyectó el HTML
    if (!tn || !tj) {
        console.warn('⚠️ Tablas de clientes no listas, reintentando...');
        setTimeout(window.initClientesListado, 25);
        return;
    }

    try {
        console.log('📡 GET /api/panel/clients');
        const res = await fetch('/api/panel/clients', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        console.log('📡 Status:', res.status);

        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            tn.innerHTML = `<tr><td colspan="7" class="text-center text-danger">${err.message || 'Error al cargar clientes'}</td></tr>`;
            tj.innerHTML = `<tr><td colspan="6" class="text-center text-danger">${err.message || 'Error al cargar clientes'}</td></tr>`;
            return;
        }

        const clientes = await res.json();
        const naturales = clientes.filter(c => c.tipo_cliente === 'Natural');
        const juridicos = clientes.filter(c => c.tipo_cliente === 'Jurídica');

        // Tabla Naturales
        if (naturales.length === 0) {
            tn.innerHTML = `<tr><td colspan="7" class="text-center text-warning">No hay clientes naturales</td></tr>`;
        } else {
            tn.innerHTML = naturales.map(c => `
                <tr>
                    <td>${c.nombres || '—'}</td>
                    <td>${c.apellidos || '—'}</td>
                    <td>${c.numero_documento || '—'}</td>
                    <td>${c.email || '—'}</td>
                    <td>${c.telefono || '—'}</td>
                    <td>
                        <span class="badge ${c.estado === 'Activo' ? 'bg-success' : 'bg-danger'}">
                            ${c.estado || '—'}
                        </span>
                    </td>
                    <td class="text-center">
                        ${
                            c.estado === 'Activo'
                            ? `<button class="btn btn-danger btn-sm" title="Desactivar" onclick="desactivarCliente(${c.id_cliente})">
                                   <i class="fas fa-user-slash"></i>
                               </button>`
                            : `<button class="btn btn-success btn-sm" title="Reactivar" onclick="reactivarCliente(${c.id_cliente})">
                                   <i class="fas fa-user-check"></i>
                               </button>`
                        }
                    </td>
                </tr>
            `).join('');
        }

        // Tabla Jurídicos
        if (juridicos.length === 0) {
            tj.innerHTML = `<tr><td colspan="6" class="text-center text-warning">No hay clientes jurídicos</td></tr>`;
        } else {
            tj.innerHTML = juridicos.map(c => `
                <tr>
                    <td>${c.razon_social || '—'}</td>
                    <td>${c.numero_documento || '—'}</td>
                    <td>${c.email || '—'}</td>
                    <td>${c.telefono || '—'}</td>
                    <td>
                        <span class="badge ${c.estado === 'Activo' ? 'bg-success' : 'bg-danger'}">
                            ${c.estado || '—'}
                        </span>
                    </td>
                    <td class="text-center">
                        ${
                            c.estado === 'Activo'
                            ? `<button class="btn btn-danger btn-sm" title="Desactivar" onclick="desactivarCliente(${c.id_cliente})">
                                   <i class="fas fa-user-slash"></i>
                               </button>`
                            : `<button class="btn btn-success btn-sm" title="Reactivar" onclick="reactivarCliente(${c.id_cliente})">
                                   <i class="fas fa-user-check"></i>
                               </button>`
                        }
                    </td>
                </tr>
            `).join('');
        }
    } catch (error) {
        console.error('❌ Error de red:', error);
        tn.innerHTML = `<tr><td colspan="7" class="text-center text-danger">Error de conexión</td></tr>`;
        tj.innerHTML = `<tr><td colspan="6" class="text-center text-danger">Error de conexión</td></tr>`;
    }
};

// Desactivar cliente
window.desactivarCliente = function (id) {
    const token = localStorage.getItem('token');

    if (typeof Swal === 'undefined') {
        if (!confirm('¿Desactivar cliente?')) return;
        fetch(`/api/panel/clients/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        }).then(() => window.initClientesListado());
        return;
    }

    Swal.fire({
        title: 'Desactivar cliente',
        text: '¿Seguro que deseas desactivar este cliente?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, desactivar',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#2E7D32',
        cancelButtonColor: '#6c757d',
        reverseButtons: true,
        buttonsStyling: false,
        customClass: {
            confirmButton: 'btn btn-primary',
            cancelButton: 'btn btn-secondary',
            actions: 'swal2-actions-spaced'
        }
    }).then(async (r) => {
        if (!r.isConfirmed) return;
        try {
            const res = await fetch(`/api/panel/clients/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                await Swal.fire({ icon: 'success', title: 'Cliente desactivado', timer: 1400, showConfirmButton: false });
                window.initClientesListado();
            } else {
                const e = await res.json().catch(() => ({}));
                Swal.fire({ icon: 'error', title: 'No se pudo desactivar', text: e.message || 'Error desconocido', confirmButtonColor: '#2E7D32' });
            }
        } catch {
            Swal.fire({ icon: 'error', title: 'Error de conexión', confirmButtonColor: '#2E7D32' });
        }
    });
};

// Reactivar cliente
window.reactivarCliente = function (id) {
    const token = localStorage.getItem('token');

    if (typeof Swal === 'undefined') {
        if (!confirm('¿Reactivar cliente?')) return;
        fetch(`/api/panel/clients/${id}/activate`, {
            method: 'PATCH',
            headers: { 'Authorization': `Bearer ${token}` }
        }).then(() => window.initClientesListado());
        return;
    }

    Swal.fire({
        title: 'Reactivar cliente',
        text: '¿Seguro que deseas reactivar este cliente?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Sí, reactivar',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#2E7D32',
        cancelButtonColor: '#6c757d',
        reverseButtons: true,
        buttonsStyling: false,
        customClass: {
            confirmButton: 'btn btn-primary',
            cancelButton: 'btn btn-secondary',
            actions: 'swal2-actions-spaced'
        }
    }).then(async (r) => {
        if (!r.isConfirmed) return;
        try {
            const res = await fetch(`/api/panel/clients/${id}/activate`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                await Swal.fire({ icon: 'success', title: 'Cliente reactivado', timer: 1400, showConfirmButton: false });
                window.initClientesListado();
            } else {
                const e = await res.json().catch(() => ({}));
                Swal.fire({ icon: 'error', title: 'No se pudo reactivar', text: e.message || 'Error desconocido', confirmButtonColor: '#2E7D32' });
            }
        } catch {
            Swal.fire({ icon: 'error', title: 'Error de conexión', confirmButtonColor: '#2E7D32' });
        }
    });
};