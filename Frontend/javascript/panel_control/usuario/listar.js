// Convertir a función global en lugar de DOMContentLoaded
window.initUsuariosListado = async function () {
    console.log('🟢 Ejecutando initUsuariosListado desde listar.js');
    
    const token = localStorage.getItem('token');
    if (!token) {
        console.log('❌ No hay token');
        window.location.href = '/panel-login';
        return;
    }

    // Esperar a que el DOM esté listo
    const tbody = document.querySelector('#tablaUsuarios tbody');
    if (!tbody) {
        console.warn('⚠️ Tabla no encontrada, reintentando...');
        setTimeout(window.initUsuariosListado, 25);
        return;
    }

    try {
        console.log('📡 Haciendo petición a /api/panel/users...');
        const response = await fetch('/api/panel/users', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        console.log('📡 Response status:', response.status);

        if (response.ok) {
            const usuarios = await response.json();
            console.log('👥 Usuarios recibidos:', usuarios);
            console.log('📊 Cantidad usuarios:', usuarios.length);
            
            if (!Array.isArray(usuarios) || usuarios.length === 0) {
                tbody.innerHTML = `<tr><td colspan="7" class="text-center text-warning">No hay usuarios registrados</td></tr>`;
                return;
            }

            tbody.innerHTML = usuarios.map(u => `
                <tr>
                    <td>${u.nombres || 'N/A'}</td>
                    <td>${u.apellidos || 'N/A'}</td>
                    <td>${u.email || 'N/A'}</td>
                    <td>${u.username || 'N/A'}</td>
                    <td>${u.cargo || 'N/A'}</td>
                    <td>
                        <span class="badge ${u.estado === 'Activo' ? 'bg-success' : 'bg-danger'}">
                            ${u.estado || 'N/A'}
                        </span>
                    </td>
                    <td class="text-center">
                        <button class="btn btn-warning btn-sm me-1" title="Editar" onclick="editarUsuario(${u.id_usuario})">
                            <i class="fas fa-edit"></i>
                        </button>
                        ${
                        u.estado === 'Activo'
                        ? `<button class="btn btn-danger btn-sm" title="Desactivar" onclick="desactivarUsuario(${u.id_usuario})">
                                <i class="fas fa-user-slash"></i>
                            </button>`
                        : `<button class="btn btn-success btn-sm" title="Reactivar" onclick="reactivarUsuario(${u.id_usuario})">
                                <i class="fas fa-user-check"></i>
                            </button>`
                        }
                    </td>
                </tr>
            `).join('');
            
            // ✅ FUNCIÓN GLOBAL PARA EDITAR USUARIO (DENTRO DEL PANEL)
            window.editarUsuario = function(id) {
                console.log('📝 Editando usuario ID:', id);
                
                // Verificar que el panel control existe
                if (window.panelControl && typeof window.panelControl.loadActualizarUsuario === 'function') {
                    window.panelControl.loadActualizarUsuario(id);
                } else {
                    console.error('Panel control no disponible o método no encontrado');
                    console.log('window.panelControl:', window.panelControl);
                    
                    // Fallback: recargar la página con parámetro
                    window.location.href = `/panel-control#usuario-editar-${id}`;
                }
            };

            console.log('✅ Usuarios cargados correctamente');
        } else {
            let errorMsg = 'Error al cargar usuarios';
            try {
                const errorData = await response.json();
                errorMsg = errorData.message || errorMsg;
                console.error('❌ Error del servidor:', errorData);
            } catch (e) {
                console.error('❌ Error parsing response:', e);
            }
            tbody.innerHTML = `<tr><td colspan="7" class="text-center text-danger">${errorMsg}</td></tr>`;
        }
    } catch (error) {
        console.error('❌ Error de red:', error);
        tbody.innerHTML = `<tr><td colspan="7" class="text-center text-danger">Error de conexión</td></tr>`;
    }
};

// Función global para desactivar usuario
window.desactivarUsuario = function (id) {
    // Fallback si no existe SweetAlert2
    if (typeof Swal === 'undefined') {
        if (!confirm('¿Seguro que deseas desactivar este usuario?')) return;
        const token = localStorage.getItem('token');
        fetch(`/api/panel/users/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        }).then(async res => {
            if (res.ok) {
                window.initUsuariosListado();
            } else {
                const error = await res.json().catch(() => ({}));
                alert(`No se pudo desactivar: ${error.message || 'Error desconocido'}`);
            }
        }).catch(() => alert('Error de conexión'));
        return;
    }

    Swal.fire({
        title: 'Desactivar usuario',
        text: '¿Seguro que deseas desactivar este usuario?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, desactivar',
        cancelButtonText: 'Cancelar',
        // Colores alineados al proyecto
        confirmButtonColor: '#2E7D32',
        cancelButtonColor: '#6c757d',
        reverseButtons: true,
        buttonsStyling: false,
        customClass: {
            confirmButton: 'btn btn-primary',
            cancelButton: 'btn btn-secondary',
            actions: 'swal2-actions-spaced'
        }
    }).then(async (result) => {
        if (!result.isConfirmed) return;

        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`/api/panel/users/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                await Swal.fire({
                    icon: 'success',
                    title: 'Usuario desactivado',
                    timer: 1400,
                    showConfirmButton: false
                });
                window.initUsuariosListado(); // Recargar lista
            } else {
                const error = await res.json().catch(() => ({}));
                Swal.fire({
                    icon: 'error',
                    title: 'No se pudo desactivar',
                    text: error.message || 'Error desconocido',
                    confirmButtonColor: '#2E7D32'
                });
            }
        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'Error de conexión',
                confirmButtonColor: '#2E7D32'
            });
        }
    });
};

window.reactivarUsuario = function (id) {
    // Fallback si no hay SweetAlert2
    if (typeof Swal === 'undefined') {
        if (!confirm('¿Seguro que deseas reactivar este usuario?')) return;
        const token = localStorage.getItem('token');
        fetch(`/api/panel/users/${id}/activate`, {
            method: 'PATCH',
            headers: { 'Authorization': `Bearer ${token}` }
        }).then(async res => {
            if (res.ok) {
                window.initUsuariosListado();
            } else {
                const error = await res.json().catch(() => ({}));
                alert(`No se pudo reactivar: ${error.message || 'Error desconocido'}`);
            }
        }).catch(() => alert('Error de conexión'));
        return;
    }

    Swal.fire({
        title: 'Reactivar usuario',
        text: '¿Seguro que deseas reactivar este usuario?',
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
    }).then(async (result) => {
        if (!result.isConfirmed) return;

        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`/api/panel/users/${id}/activate`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                await Swal.fire({
                    icon: 'success',
                    title: 'Usuario reactivado',
                    timer: 1400,
                    showConfirmButton: false
                });
                window.initUsuariosListado();
            } else {
                const error = await res.json().catch(() => ({}));
                Swal.fire({
                    icon: 'error',
                    title: 'No se pudo reactivar',
                    text: error.message || 'Error desconocido',
                    confirmButtonColor: '#2E7D32'
                });
            }
        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'Error de conexión',
                confirmButtonColor: '#2E7D32'
            });
        }
    });
};