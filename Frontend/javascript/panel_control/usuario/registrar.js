window.initRegistrarUsuario = async function () {
    console.log('🟢 Iniciando formulario Registrar Usuario');

    // Contexto del panel
    if (window.panelControl) {
        window.panelControl.currentSection = 'usuarios_registrar';
        const title = document.getElementById('pageTitle');
        if (title) title.textContent = 'Registrar Usuario';
    }

    // Loading overlay
    const overlay = document.getElementById('loadingOverlay');
    const showLoading = () => { if (overlay) overlay.style.display = 'flex'; };
    const hideLoading = () => { if (overlay) overlay.style.display = 'none'; };

    // Auth
    const token = localStorage.getItem('token');
    if (!token) {
        alert('Sesión expirada, inicia sesión nuevamente.');
        window.location.href = '/panel-login';
        return;
    }

    // Referencias del DOM
    const form = document.getElementById('formRegistrarUsuario');
    const nombres = document.getElementById('nombres');
    const apellidos = document.getElementById('apellidos');
    const email = document.getElementById('email');
    const username = document.getElementById('username');
    const password = document.getElementById('password');
    const passwordConfirm = document.getElementById('passwordConfirm');
    const id_cargo = document.getElementById('id_cargo');
    const btnVolver = document.getElementById('btnVolverUsuarios');

    // Cargar cargos
    async function cargarCargos() {
        console.log('📦 Cargando cargos...');
        try {
            const res = await fetch('/api/panel/users/cargos/list', {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log('📡 Status cargos:', res.status);
            if (!res.ok) throw new Error(`Status ${res.status}`);

            const cargos = await res.json();
            if (!Array.isArray(cargos) || cargos.length === 0) {
                id_cargo.innerHTML = '<option value="">No hay cargos disponibles</option>';
                return;
            }

            id_cargo.innerHTML = '<option value="">Seleccionar cargo...</option>';
            cargos.forEach(c => {
                const opt = document.createElement('option');
                opt.value = c.id_cargo;
                opt.textContent = c.nombre_cargo;
                id_cargo.appendChild(opt);
            });
            console.log('✅ Cargos cargados:', cargos.length);
        } catch (e) {
            console.error('❌ Error cargando cargos:', e);
            if (id_cargo) id_cargo.innerHTML = '<option value="">Error cargando cargos</option>';
        }
    }

    showLoading();
    await cargarCargos();
    hideLoading();

    // Validaciones
    function validar() {
        if (!nombres.value.trim() || !apellidos.value.trim() ||
            !email.value.trim() || !username.value.trim() ||
            !password.value || !passwordConfirm.value || !id_cargo.value) {
            alert('Completa todos los campos requeridos.');
            return false;
        }
        if (password.value.length < 6) {
            alert('La contraseña debe tener al menos 6 caracteres.');
            return false;
        }
        if (password.value !== passwordConfirm.value) {
            alert('Las contraseñas no coinciden.');
            return false;
        }
        return true;
    }

    // Botón Volver (sin clonar)
    if (btnVolver) {
        btnVolver.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('🔙 Volver a usuarios (registrar)');
            if (window.panelControl) {
                window.panelControl.loadSection('usuarios');
            } else {
                window.location.href = '/panel-control#usuarios';
            }
        });
    }

    // Submit del formulario (sin clonar el form)
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!validar()) return;

            const payload = {
                nombres: nombres.value.trim(),
                apellidos: apellidos.value.trim(),
                email: email.value.trim(),
                username: username.value.trim(),
                contraseña: password.value, // el backend espera 'contraseña'
                id_cargo: parseInt(id_cargo.value, 10)
                // estado no se envía: default en BD
            };

            try {
                showLoading();
                console.log('📤 Enviando registro usuario...', payload);
                const res = await fetch('/api/panel/users', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(payload)
                });

                console.log('📡 Status registro:', res.status);
                const data = await res.json().catch(() => ({}));

                if (res.ok) {
                    if (typeof Swal !== 'undefined') {
                        await Swal.fire({
                            icon: 'success',
                            title: 'Usuario creado',
                            text: 'El usuario se registró correctamente.',
                            confirmButtonColor: '#2E7D32'
                        });
                    } else {
                        alert('Usuario registrado correctamente.');
                    }
                    if (window.panelControl) {
                        window.panelControl.loadSection('usuarios');
                    } else {
                        window.location.href = '/panel-control#usuarios';
                    }
                } else {
                    alert(data.message || 'No se pudo registrar el usuario.');
                    if (res.status === 401 || res.status === 403) {
                        // Sesión inválida
                        window.location.href = '/panel-login';
                    }
                }
            } catch (error) {
                console.error('❌ Error registrando usuario:', error);
                alert('Error de conexión.');
            } finally {
                hideLoading();
            }
        });
    }
};