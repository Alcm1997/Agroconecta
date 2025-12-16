// Inicializador global
window.initUnidadesListado = async function () {
    console.log('🟢 Ejecutando initUnidadesListado');

    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/html/panel_control/login-panel.html';
        return;
    }

    const tbody = document.querySelector('#tablaUnidades tbody');
    if (!tbody) {
        console.warn('⚠️ Tabla de unidades no lista, reintentando...');
        setTimeout(window.initUnidadesListado, 25);
        return;
    }

    try {
        console.log('📡 GET /api/panel/unidades-medida');
        const res = await fetch('/api/panel/unidades-medida', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            tbody.innerHTML = `<tr><td colspan="3" class="text-center text-danger">${err.message || 'Error al cargar unidades'}</td></tr>`;
            return;
        }

        const unidades = await res.json();

        if (unidades.length === 0) {
            tbody.innerHTML = `<tr><td colspan="3" class="text-center text-warning">No hay unidades de medida registradas</td></tr>`;
        } else {
            tbody.innerHTML = unidades.map(u => `
                <tr>
                    <td>${u.id_unidad}</td>
                    <td>
                        <span class="fw-medium">${u.descripcion}</span>
                    </td>
                    <td class="text-center">
                        <button class="btn btn-warning btn-sm me-1" title="Editar" onclick="editarUnidad(${u.id_unidad})">
                            <i class="fas fa-edit"></i>
                        </button>
                    </td>
                </tr>
            `).join('');
        }
    } catch (error) {
        console.error('❌ Error de red:', error);
        tbody.innerHTML = `<tr><td colspan="3" class="text-center text-danger">Error de conexión</td></tr>`;
    }
};

// Modal nueva unidad
window.mostrarModalNuevaUnidad = function() {
    document.getElementById('tituloModal').textContent = 'Nueva Unidad de Medida';
    document.getElementById('unidadId').value = '';
    document.getElementById('descripcion').value = '';
    document.getElementById('descripcion').focus();
    new bootstrap.Modal(document.getElementById('modalUnidad')).show();
};

// Editar unidad
window.editarUnidad = async function(id) {
    const token = localStorage.getItem('token');
    try {
        const res = await fetch(`/api/panel/unidades-medida/${id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            const unidad = await res.json();
            document.getElementById('tituloModal').textContent = 'Editar Unidad de Medida';
            document.getElementById('unidadId').value = unidad.id_unidad;
            document.getElementById('descripcion').value = unidad.descripcion;
            document.getElementById('descripcion').focus();
            new bootstrap.Modal(document.getElementById('modalUnidad')).show();
        } else {
            const error = await res.json();
            Swal.fire('Error', error.message || 'No se pudo cargar la unidad', 'error');
        }
    } catch (error) {
        console.error('Error al cargar unidad:', error);
        Swal.fire('Error', 'Error de conexión al cargar la unidad', 'error');
    }
};

// Guardar unidad
window.guardarUnidad = async function() {
    const token = localStorage.getItem('token');
    const id = document.getElementById('unidadId').value;
    const descripcion = document.getElementById('descripcion').value.trim();

    if (!descripcion) {
        Swal.fire({
            icon: 'warning',
            title: 'Campo requerido',
            text: 'La descripción es requerida',
            confirmButtonColor: '#2E7D32'
        });
        document.getElementById('descripcion').focus();
        return;
    }

    if (descripcion.length > 50) {
        Swal.fire({
            icon: 'warning',
            title: 'Descripción muy larga',
            text: 'La descripción no puede exceder los 50 caracteres',
            confirmButtonColor: '#2E7D32'
        });
        return;
    }

    try {
        const url = id ? `/api/panel/unidades-medida/${id}` : '/api/panel/unidades-medida';
        const method = id ? 'PUT' : 'POST';

        const res = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ descripcion })
        });

        const result = await res.json();

        if (res.ok) {
            bootstrap.Modal.getInstance(document.getElementById('modalUnidad')).hide();
            await Swal.fire({
                icon: 'success',
                title: '¡Éxito!',
                text: result.message,
                timer: 1500,
                showConfirmButton: false
            });
            window.initUnidadesListado();
        } else {
            Swal.fire({
                icon: 'error',
                title: 'Error al guardar',
                text: result.message,
                confirmButtonColor: '#2E7D32'
            });
        }
    } catch (error) {
        console.error('Error al guardar:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error de conexión',
            text: 'No se pudo conectar con el servidor',
            confirmButtonColor: '#2E7D32'
        });
    }
};

