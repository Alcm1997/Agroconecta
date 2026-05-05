// Variables globales
        let isLoading = false;

        // Función para mostrar/ocultar contraseña (igual que en loginagroconecta)
        function togglePassword() {
            const passwordInput = document.getElementById('password');
            const iconoPassword = document.getElementById('iconoPassword');

            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                iconoPassword.classList.replace('fa-eye-slash', 'fa-eye');
            } else {
                passwordInput.type = 'password';
                iconoPassword.classList.replace('fa-eye', 'fa-eye-slash');
            }
        }

        // Función para mostrar estado de carga
        function setLoading(loading) {
            isLoading = loading;
            const loginBtn = document.getElementById('loginBtn');
            const loginBtnText = document.getElementById('loginBtnText');
            const loadingSpinner = document.querySelector('.loading-spinner');

            if (loading) {
                loginBtn.disabled = true;
                loginBtnText.textContent = 'Verificando...';
                loadingSpinner.style.display = 'inline-block';
            } else {
                loginBtn.disabled = false;
                loginBtnText.textContent = 'Ingresar al Panel';
                loadingSpinner.style.display = 'none';
            }
        }

        // Función para mostrar errores
        function showError(message) {
            const errorDiv = document.getElementById('loginError');
            const errorText = document.getElementById('errorText');

            errorText.textContent = message;
            errorDiv.style.display = 'block';

            // Ocultar el error después de 5 segundos
            setTimeout(() => {
                errorDiv.style.display = 'none';
            }, 5000);
        }

        // Función para ocultar errores
        function hideError() {
            document.getElementById('loginError').style.display = 'none';
        }

        // ✅ FIX BFCACHE: resetear estado si el navegador restaura la página desde caché
        window.addEventListener('pageshow', function (event) {
            if (event.persisted) {
                setLoading(false);
            }
        });

        // ✅ FIX: Si ya hay sesión activa, redirigir directo al panel
        async function checkExistingSession() {
            const token = localStorage.getItem('token');
            if (!token) return;

            setLoading(true);
            try {
                const response = await fetch('/api/panel/auth/verify-admin', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (response.ok) {
                    // Token válido → ir directo a menu.html sin pasar por historial
                    window.location.replace('/html/panel_control/menu.html');
                } else {
                    // Token expirado o inválido → limpiar y mostrar formulario
                    localStorage.removeItem('token');
                    setLoading(false);
                }
            } catch (e) {
                localStorage.removeItem('token');
                setLoading(false);
            }
        }

        // Event listeners al cargar la página
        document.addEventListener('DOMContentLoaded', function () {
            // Verificar sesión existente primero
            checkExistingSession();

            const form = document.getElementById('loginPanelForm');
            const usernameInput = document.getElementById('username');
            const passwordInput = document.getElementById('password');

            // Enfocar el campo de usuario al cargar
            usernameInput.focus();

            // Ocultar errores cuando el usuario empiece a escribir
            usernameInput.addEventListener('input', hideError);
            passwordInput.addEventListener('input', hideError);

            // Manejar envío del formulario
            form.addEventListener('submit', async function (e) {
                e.preventDefault();

                if (isLoading) return;

                const username = usernameInput.value.trim();
                const password = passwordInput.value.trim();

                // Validaciones básicas
                if (!username) {
                    showError('Por favor ingresa tu usuario');
                    usernameInput.focus();
                    return;
                }

                if (!password) {
                    showError('Por favor ingresa tu contraseña');
                    passwordInput.focus();
                    return;
                }

                // Iniciar proceso de login
                setLoading(true);
                hideError();

                console.log('🔐 Intentando login con:', username);

                try {
                    const response = await fetch('/api/panel/auth/login', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ username, password })
                    });

                    const result = await response.json();

                    if (response.ok) {
                        console.log('✅ Login exitoso');

                        // Guardar token y timestamp del último acceso
                        localStorage.setItem('token', result.token);
                        localStorage.setItem('ultimo_acceso_panel', new Date().toISOString());

                        // Mostrar mensaje de éxito
                        Swal.fire({
                            title: '¡Acceso Autorizado!',
                            text: 'Bienvenido al Panel de Control',
                            icon: 'success',
                            timer: 1500,
                            showConfirmButton: false,
                            allowOutsideClick: false,
                            didOpen: () => {
                                Swal.showLoading();
                            }
                        }).then(() => {
                            // ✅ replace() elimina el login del historial → atrás no vuelve aquí
                            window.location.replace('/html/panel_control/menu.html');
                        });

                    } else {
                        console.log('❌ Error de login:', result.message);
                        setLoading(false);
                        showError(result.message || 'Usuario o contraseña incorrectos');

                        // Limpiar campo de contraseña y enfocar usuario
                        passwordInput.value = '';
                        usernameInput.focus();
                    }

                } catch (error) {
                    console.error('💥 Error de conexión:', error);
                    setLoading(false);
                    showError('Error de conexión. Verifica tu conexión a internet.');
                }
            });

            // Permitir envío con Enter
            [usernameInput, passwordInput].forEach(input => {
                input.addEventListener('keypress', function (e) {
                    if (e.key === 'Enter' && !isLoading) {
                        form.dispatchEvent(new Event('submit'));
                    }
                });
            });
        });

        // Manejar errores globales
        window.addEventListener('error', function (e) {
            console.error('Error global:', e.error);
        });

        // Prevenir envío múltiple
        window.addEventListener('beforeunload', function () {
            if (isLoading) {
                return 'Se está procesando tu solicitud...';
            }
        });
