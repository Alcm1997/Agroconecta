// ========== GESTIÓN DE ASESORÍAS ==========

    let asesoriasData = [];

    function getToken() {
        return localStorage.getItem('panelToken') || localStorage.getItem('token');
    }

    async function cargarAsesorias() {
        const token = getToken();
        const tbody = document.getElementById('listaAsesorias');
        const filtroEstado = document.getElementById('filtroEstado').value;

        tbody.innerHTML = `
        <tr>
            <td colspan="7" class="text-center py-4">
                <i class="fas fa-spinner fa-spin me-2"></i>Cargando...
            </td>
        </tr>
    `;

        try {
            let url = '/api/panel/asesorias';
            if (filtroEstado) url += `?estado=${filtroEstado}`;

            const response = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) throw new Error('Error al cargar asesorías');

            const data = await response.json();
            asesoriasData = data.consultas || [];

            // Actualizar stats
            actualizarStats(asesoriasData);

            if (asesoriasData.length === 0) {
                tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center py-4 text-muted">
                        <i class="fas fa-inbox fa-2x mb-2 d-block"></i>
                        No hay consultas registradas
                    </td>
                </tr>
            `;
                return;
            }

            tbody.innerHTML = asesoriasData.map(a => `
            <tr>
                <td><strong>#${a.id_consulta}</strong></td>
                <td>${escapeHtml(a.nombre)}</td>
                <td>
                    <a href="mailto:${a.email}" class="text-decoration-none">
                        ${escapeHtml(a.email)}
                    </a>
                </td>
                <td>
                    <span title="${escapeHtml(a.mensaje)}">
                        ${escapeHtml(a.mensaje.substring(0, 50))}${a.mensaje.length > 50 ? '...' : ''}
                    </span>
                </td>
                <td>${formatearFecha(a.fecha_consulta)}</td>
                <td>${getBadgeEstado(a.estado)}</td>
                <td>
                    <div class="btn-group btn-group-sm">
                        <button class="btn btn-outline-primary" onclick="verDetalleAsesoria(${a.id_consulta})" title="Ver detalle">
                            <i class="fas fa-eye"></i>
                        </button>
                        ${a.estado === 'Pendiente' ? `
                            <button class="btn btn-outline-success" onclick="abrirModalResponderRapido(${a.id_consulta})" title="Responder consulta">
                                <i class="fas fa-reply"></i> Responder
                            </button>
                        ` : ''}
                    </div>
                </td>
            </tr>
        `).join('');

        } catch (error) {
            console.error('Error:', error);
            tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center py-4 text-danger">
                    <i class="fas fa-exclamation-triangle me-2"></i>Error al cargar consultas
                </td>
            </tr>
        `;
        }
    }

    function actualizarStats(consultas) {
        const pendientes = consultas.filter(c => c.estado === 'Pendiente').length;
        const respondidas = consultas.filter(c => c.estado === 'Respondida').length;
        const cerradas = consultas.filter(c => c.estado === 'Cerrada').length;

        document.getElementById('statPendientes').textContent = pendientes;
        document.getElementById('statRespondidas').textContent = respondidas;
        document.getElementById('statCerradas').textContent = cerradas;
    }

    function getBadgeEstado(estado) {
        const badges = {
            'Pendiente': '<span class="badge bg-warning text-dark">Pendiente</span>',
            'Respondida': '<span class="badge bg-success">Respondida</span>',
            'Cerrada': '<span class="badge bg-secondary">Cerrada</span>'
        };
        return badges[estado] || `<span class="badge bg-info">${estado}</span>`;
    }

    function formatearFecha(fecha) {
        if (!fecha) return '-';
        return new Date(fecha).toLocaleDateString('es-PE', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text || '';
        return div.innerHTML;
    }

    async function verDetalleAsesoria(id) {
        const asesoria = asesoriasData.find(a => a.id_consulta === id);
        if (!asesoria) return;

        const content = document.getElementById('detalleAsesoriaContent');
        content.innerHTML = `
        <div class="row">
            <div class="col-md-6 mb-3">
                <label class="form-label text-muted small">Nombre</label>
                <p class="mb-0 fw-bold">${escapeHtml(asesoria.nombre)}</p>
            </div>
            <div class="col-md-6 mb-3">
                <label class="form-label text-muted small">Email</label>
                <p class="mb-0">
                    <a href="mailto:${asesoria.email}">${escapeHtml(asesoria.email)}</a>
                </p>
            </div>
        </div>
        <div class="row">
            <div class="col-md-6 mb-3">
                <label class="form-label text-muted small">Fecha de Consulta</label>
                <p class="mb-0">${formatearFecha(asesoria.fecha_consulta)}</p>
            </div>
            <div class="col-md-6 mb-3">
                <label class="form-label text-muted small">Estado</label>
                <p class="mb-0">${getBadgeEstado(asesoria.estado)}</p>
            </div>
        </div>
        ${asesoria.fecha_respuesta ? `
        <div class="row">
            <div class="col-md-6 mb-3">
                <label class="form-label text-muted small">Respondido por</label>
                <p class="mb-0">${escapeHtml(asesoria.respondido_por_nombre || '-')}</p>
            </div>
            <div class="col-md-6 mb-3">
                <label class="form-label text-muted small">Fecha Respuesta</label>
                <p class="mb-0">${formatearFecha(asesoria.fecha_respuesta)}</p>
            </div>
        </div>
        ` : ''}
        <div class="mb-3">
            <label class="form-label text-muted small">Mensaje del Cliente</label>
            <div class="p-3 bg-light rounded border" style="white-space: pre-wrap; border-left: 4px solid #2E7D32 !important;">
                ${escapeHtml(asesoria.mensaje)}
            </div>
        </div>
        ${asesoria.respuesta_texto ? `
        <div class="mb-3">
            <label class="form-label text-muted small">Tu Respuesta</label>
            <div class="p-3 bg-light rounded border" style="white-space: pre-wrap; border-left: 4px solid #E91E63 !important;">
                ${escapeHtml(asesoria.respuesta_texto)}
            </div>
        </div>
        ` : ''}
    `;

        const modal = new bootstrap.Modal(document.getElementById('modalDetalleAsesoria'));
        modal.show();
    }

    window.abrirModalResponderRapido = function(id) {
        const asesoria = asesoriasData.find(a => a.id_consulta === id);
        if (!asesoria) return;
        
        document.getElementById('responderIdConsulta').value = asesoria.id_consulta;
        document.getElementById('responderClienteNombre').textContent = `${asesoria.nombre} <${asesoria.email}>`;
        document.getElementById('respuestaTexto').value = '';
        
        const modalResponder = new bootstrap.Modal(document.getElementById('modalResponderAsesoria'));
        modalResponder.show();
    };

    window.enviarRespuesta = async function() {
        const id = document.getElementById('responderIdConsulta').value;
        const respuesta = document.getElementById('respuestaTexto').value;

        if (!respuesta.trim()) {
            Swal.fire('Error', 'Debes escribir una respuesta para el cliente.', 'warning');
            return;
        }

        const btn = document.getElementById('btnEnviarRespuesta');
        const txtOriginal = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i>Enviando...';
        btn.disabled = true;

        try {
            const token = getToken();
            const response = await fetch(`/api/panel/asesorias/${id}/responder`, {
                method: 'PUT',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ respuesta })
            });

            const data = await response.json();

            if (!response.ok) throw new Error(data.message || 'Error al enviar');

            const modal = bootstrap.Modal.getInstance(document.getElementById('modalResponderAsesoria'));
            modal.hide();

            Swal.fire('¡Enviado!', 'El correo se envió al cliente exitosamente.', 'success');
            cargarAsesorias();
        } catch (error) {
            console.error(error);
            Swal.fire('Error', error.message || 'No se pudo enviar la respuesta por correo.', 'error');
        } finally {
            btn.innerHTML = txtOriginal;
            btn.disabled = false;
        }
    };

    // Event listener para filtro
    document.getElementById('filtroEstado').addEventListener('change', cargarAsesorias);

    // Exponer globalmente para que menu.js pueda llamarla al recargar la sección
    window.cargarAsesorias = cargarAsesorias;

    // Cargar al iniciar
    cargarAsesorias();
