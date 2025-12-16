function togglePassword() {
    const passwordInput = document.getElementById('contrasena');
    const icon = document.getElementById('iconoPassword');

    // Cambiar tipo de input
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        icon.classList.replace('fa-eye-slash', 'fa-eye');
    } else {
        passwordInput.type = 'password';
        icon.classList.replace('fa-eye', 'fa-eye-slash');
    }
}

document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('loginForm').addEventListener('submit', async function (e) {
        e.preventDefault();

        const email = document.getElementById('email').value;
        const contrasena = document.getElementById('contrasena').value;

        try {
            const response = await fetch('http://localhost:3001/api/client/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, contrasena })
            });

            const result = await response.json();

            if (response.ok) {
                // Guardar token en localStorage
                localStorage.setItem('token', result.token);

                // ✅ NUEVO: Guardar datos del cliente para identificar su carrito
                if (result.cliente) {
                    localStorage.setItem('cliente', JSON.stringify(result.cliente));

                    // ✅ NUEVO: Sincronizar carrito temporal con el del servidor
                    await sincronizarCarritoAlLogin(result.token, result.cliente.id_cliente);
                }

                Swal.fire({
                    title: '¡Login Exitoso!',
                    text: 'Serás redirigido en un momento.',
                    icon: 'success',
                    timer: 2000, // La alerta se cierra automáticamente después de 2 segundos
                    showConfirmButton: false, // Oculta el botón "Aceptar"
                    allowOutsideClick: false
                }).then(() => {
                    // Redirige al usuario después de que la alerta se cierre
                    window.location.href = '/';
                });
            } else {
                document.getElementById('loginError').textContent = result.message || 'Error al iniciar sesión';
            }
        } catch (error) {
            document.getElementById('loginError').textContent = 'Error de conexión';
        }
    });
});

// ✅ NUEVA FUNCIÓN: Sincronizar carrito al hacer login
async function sincronizarCarritoAlLogin(token, id_cliente) {
    try {
        // Obtener carrito temporal (productos agregados sin login)
        const carritoTemporal = JSON.parse(localStorage.getItem('cart_tmp') || '[]');

        if (carritoTemporal.length > 0) {
            // Si hay productos temporales, enviarlos al servidor para fusionar
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
                if (data.success && data.items) {
                    // Guardar carrito fusionado en localStorage del usuario
                    localStorage.setItem(`cart_${id_cliente}`, JSON.stringify(data.items));
                    // Limpiar carrito temporal
                    localStorage.removeItem('cart_tmp');
                    console.log('✅ Carrito sincronizado y fusionado correctamente');
                }
            }
        } else {
            // Si no hay productos temporales, solo cargar el carrito del servidor
            const response = await fetch('/api/client/carrito', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success && data.items) {
                    localStorage.setItem(`cart_${id_cliente}`, JSON.stringify(data.items));
                    console.log('✅ Carrito cargado desde el servidor');
                }
            }
        }
    } catch (error) {
        console.error('Error sincronizando carrito:', error);
        // No bloquear el login si falla la sincronización
    }
}
