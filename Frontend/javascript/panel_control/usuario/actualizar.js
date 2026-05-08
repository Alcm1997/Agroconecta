window.initActualizarUsuario = async function(userId) {
    console.log('🔄 Iniciando actualización de usuario:', userId);

    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) loadingOverlay.style.display = 'flex';

    const token = localStorage.getItem('token');
    if (!token) {
        alert('No hay sesión activa');
        if (window.panelControl) {
            window.panelControl.loadSection('usuarios');
        }
        return;
    }

    try {
        // 1. Cargar cargos
        const cargoResponse = await fetch('/api/panel/users/cargos/list', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (cargoResponse.ok) {
            const cargos = await cargoResponse.json();
            const selectCargo = document.getElementById('id_cargo');
            if (selectCargo) {
                selectCargo.innerHTML = '<option value="">Seleccionar cargo...</option>';
                cargos.forEach(c => {
                    const opt = document.createElement('option');
                    opt.value = c.id_cargo;
                    opt.textContent = c.nombre_cargo;
                    selectCargo.appendChild(opt);
                });
            }
        }

        // 2. Cargar datos usuario
        const userResponse = await fetch(`/api/panel/users/${userId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (userResponse.ok) {
            const usuario = await userResponse.json();
            (document.getElementById('nombres') || {}).value = usuario.nombres || '';
            (document.getElementById('apellidos') || {}).value = usuario.apellidos || '';
            (document.getElementById('email') || {}).value = usuario.email || '';
            (document.getElementById('username') || {}).value = usuario.username || '';
            const cargoSel = document.getElementById('id_cargo');
            if (cargoSel) cargoSel.value = usuario.id_cargo || '';
        } else {
            alert('No se pudo cargar la información del usuario');
            if (window.panelControl) {
                window.panelControl.loadSection('usuarios');
            }
            return;
        }

        // 3. Botón Volver (Opción B: currentSection ya es 'usuarios_editar')
        const btnVolver = document.getElementById('btnVolverUsuarios');
        if (btnVolver) {
            const nuevo = btnVolver.cloneNode(true);
            btnVolver.parentNode.replaceChild(nuevo, btnVolver);
            nuevo.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('🔘 Volver a usuarios');
                if (window.panelControl) {
                    window.panelControl.loadSection('usuarios'); // Recarga porque currentSection = 'usuarios_editar'
                }
            });
        }

        // 4. Alternar visibilidad de contraseña
        document.querySelectorAll('.toggle-password').forEach(btn => {
            btn.addEventListener('click', function() {
                const targetId = this.getAttribute('data-target');
                const input = document.getElementById(targetId);
                const icon = this.querySelector('i');
                if (input.type === 'password') {
                    input.type = 'text';
                    icon.classList.remove('fa-eye');
                    icon.classList.add('fa-eye-slash');
                } else {
                    input.type = 'password';
                    icon.classList.remove('fa-eye-slash');
                    icon.classList.add('fa-eye');
                }
            });
        });

        // 5. Submit formulario
        const form = document.getElementById('formActualizarUsuario');
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();

                const passInput = document.getElementById('password');
                const passConfirmInput = document.getElementById('passwordConfirm');
                
                const datos = {
                    nombres: (document.getElementById('nombres') || {}).value?.trim(),
                    apellidos: (document.getElementById('apellidos') || {}).value?.trim(),
                    email: (document.getElementById('email') || {}).value?.trim(),
                    username: (document.getElementById('username') || {}).value?.trim(),
                    id_cargo: parseInt((document.getElementById('id_cargo') || {}).value)
                };

                // Si hay algo escrito en la contraseña, validarla y enviarla
                if (passInput.value) {
                    const passRegex = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])[A-Za-z\d!@#$%^&*(),.?":{}|<>]{8,15}$/;
                    if (!passRegex.test(passInput.value)) {
                        Swal.fire({ icon: 'error', title: 'Seguridad insuficiente', text: 'La nueva contraseña debe tener entre 8 y 15 caracteres, e incluir letras, números y al menos un símbolo.', confirmButtonColor: '#d33' });
                        return;
                    }
                    if (passInput.value !== passConfirmInput.value) {
                        Swal.fire({ icon: 'error', title: 'Error', text: 'Las contraseñas no coinciden.', confirmButtonColor: '#d33' });
                        return;
                    }
                    datos.contraseña = passInput.value;
                }

                try {
                    if (loadingOverlay) loadingOverlay.style.display = 'flex';
                    const res = await fetch(`/api/panel/users/${userId}`, {
                        method: 'PUT',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(datos)
                    });

                    if (loadingOverlay) loadingOverlay.style.display = 'none';

                    if (res.ok) {
                        if (typeof Swal !== 'undefined') {
                            await Swal.fire({
                                title: '¡Éxito!',
                                text: 'Usuario actualizado correctamente',
                                icon: 'success',
                                confirmButtonColor: '#2E7D32'
                            });
                        } else {
                            alert('Usuario actualizado correctamente');
                        }
                        if (window.panelControl) {
                            window.panelControl.loadSection('usuarios');
                        }
                    } else {
                        const err = await res.json().catch(() => ({}));
                        const msg = err.message || 'No se pudo actualizar el usuario';
                        if (typeof Swal !== 'undefined') {
                            Swal.fire({ icon: 'error', title: 'Error', text: msg, confirmButtonColor: '#d33' });
                        } else {
                            alert(msg);
                        }
                    }
                } catch (error) {
                    if (loadingOverlay) loadingOverlay.style.display = 'none';
                    console.error('Error actualizando:', error);
                    alert('Error de conexión');
                }
            });
        }

    } catch (error) {
        console.error('Error general actualizar:', error);
        alert('Error cargando datos');
    } finally {
        if (loadingOverlay) loadingOverlay.style.display = 'none';
    }
};