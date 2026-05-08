/**
 * recuperarContrasena.js - Lógica de recuperación de contraseña (SPA Compatible)
 */
(function() {
    "use strict";

    function validarEmail() {
        const el = document.getElementById('email');
        if (!el) return false;
        const email = el.value.trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        
        if (email && !emailRegex.test(email)) {
            el.classList.add('is-invalid');
            return false;
        } else {
            el.classList.remove('is-invalid');
            return true;
        }
    }

    async function enviarCodigoRecuperacion() {
        const el = document.getElementById('email');
        if (!el) return;
        const email = el.value.trim();
        
        if (!email) {
            Swal.fire('Campo Requerido', 'Ingresa tu correo electrónico', 'warning');
            return;
        }

        if (!validarEmail()) {
            Swal.fire('Correo Inválido', 'Ingresa un correo electrónico válido', 'error');
            return;
        }

        try {
            Swal.fire({
                title: 'Enviando código...',
                text: 'Verificando cuenta',
                allowOutsideClick: false,
                didOpen: () => Swal.showLoading()
            });

            const response = await fetch('/api/recovery/send-code', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email })
            });

            const resultado = await response.json();

            if (response.ok) {
                Swal.fire({
                    title: '📧 ¡Código Enviado!',
                    html: `Código enviado a: <strong style="color: #E91E63;">${email}</strong>`,
                    icon: 'success',
                    confirmButtonText: 'Ingresar Código',
                    confirmButtonColor: '#E91E63'
                }).then(() => {
                    sessionStorage.setItem('recoveryExpiration', Date.now() + (10 * 60 * 1000));
                    const nextUrl = `/verificar-codigo?email=${encodeURIComponent(email)}`;
                    if (window.navigateTo) window.navigateTo(nextUrl);
                    else window.location.href = nextUrl;
                });
            } else {
                Swal.fire('Error', resultado.message || 'No se pudo enviar el código.', 'error');
            }
        } catch (error) {
            Swal.fire('Error de Conexión', 'No se pudo conectar con el servidor.', 'error');
        }
    }

    const initRecuperar = () => {
        const form = document.getElementById('recuperarForm');
        const emailInput = document.getElementById('email');
        if (!form || !emailInput) return;

        form.addEventListener('submit', function(e) {
            e.preventDefault();
            enviarCodigoRecuperacion();
        });

        emailInput.addEventListener('input', validarEmail);
    };

    initRecuperar();

})();