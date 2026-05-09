/**
 * loginCliente.js - Lógica de inicio de sesión (SPA Compatible)
 */
(function() {
    "use strict";

    function togglePassword() {
        const passwordInput = document.getElementById('contrasena');
        const icon = document.getElementById('iconoPassword');
        if (!passwordInput || !icon) return;

        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            icon.classList.replace('fa-eye-slash', 'fa-eye');
        } else {
            passwordInput.type = 'password';
            icon.classList.replace('fa-eye', 'fa-eye-slash');
        }
    }
    // Exponer al HTML si es necesario por onclick inline
    window.togglePassword = togglePassword;

    async function sincronizarCarritoAlLogin(token, id_cliente) {
        try {
            const carritoTemporal = JSON.parse(localStorage.getItem('cart_tmp') || '[]');

            if (carritoTemporal.length > 0) {
                const response = await fetch('/api/client/carrito/sincronizar', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ items: carritoTemporal })
                });

                if (response.ok) {
                    const data = await response.json();
                    if (data.success && data.data && data.data.items) {
                        localStorage.setItem(`cart_${id_cliente}`, JSON.stringify(data.data.items));
                        localStorage.removeItem('cart_tmp');
                    }
                }
            } else {
                const response = await fetch('/api/client/carrito', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (response.ok) {
                    const data = await response.json();
                    if (data.success && data.data && data.data.items) {
                        localStorage.setItem(`cart_${id_cliente}`, JSON.stringify(data.data.items));
                    }
                }
            }
        } catch (error) {
            console.error('Error sincronizando carrito:', error);
        }
    }

    const initLogin = function () {
        const loginForm = document.getElementById('loginForm');
        if (!loginForm) return;

        loginForm.addEventListener('submit', async function (e) {
            e.preventDefault();

            const email = document.getElementById('email').value;
            const errorEl = document.getElementById('loginError');

            if (email.length > 50) {
                if (errorEl) errorEl.textContent = 'El correo electrónico no puede exceder los 50 caracteres.';
                return;
            }

            const contrasenaInput = document.getElementById('contrasena');
            const contrasena = contrasenaInput.value;

            if (contrasena.length < 8 || contrasena.length > 15) {
                contrasenaInput.classList.add('is-invalid');
                if (errorEl) errorEl.textContent = 'La contraseña debe tener entre 8 y 15 caracteres.';
                return;
            } else {
                contrasenaInput.classList.remove('is-invalid');
                if (errorEl) errorEl.textContent = '';
            }

            try {
                const response = await fetch('/api/client/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, contrasena })
                });

                const result = await response.json();

                if (response.ok) {
                    const tokenString = (result.token || '').replace(/^"|"$/g, '').trim();
                    localStorage.setItem('token', tokenString);
                    localStorage.setItem('token_cliente', tokenString);

                    if (result.cliente) {
                        localStorage.setItem('cliente', JSON.stringify(result.cliente));
                        await sincronizarCarritoAlLogin(tokenString, result.cliente.id_cliente);
                    }

                    Swal.fire({
                        title: '¡Login Exitoso!',
                        text: 'Serás redirigido en un momento.',
                        icon: 'success',
                        timer: 1500,
                        showConfirmButton: false,
                        allowOutsideClick: false
                    }).then(() => {
                        if (window.navigateTo) {
                            window.navigateTo('/');
                        } else {
                            window.location.href = '/';
                        }
                        
                        setTimeout(() => {
                            window.dispatchEvent(new CustomEvent('authUpdated'));
                            if (window.navbarController && window.navbarController.updateAuthUI) {
                                window.navbarController.updateAuthUI();
                            }
                        }, 300);
                    });
                } else {
                    if (errorEl) errorEl.textContent = result.message || 'Error al iniciar sesión';
                }
            } catch (error) {
                if (errorEl) errorEl.textContent = 'Error de conexión';
            }
        });
    };

    initLogin();

})();
