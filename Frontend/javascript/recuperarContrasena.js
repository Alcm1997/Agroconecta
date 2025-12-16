document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('recuperarForm');
    const emailInput = document.getElementById('email');
    const submitBtn = document.getElementById('buscarBtn');

    // Manejar envío del formulario
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        enviarCodigoRecuperacion();
    });

    // Validación en tiempo real
    emailInput.addEventListener('input', function() {
        validarEmail();
    });
});

function validarEmail() {
    const email = document.getElementById('email').value.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (email && !emailRegex.test(email)) {
        document.getElementById('email').classList.add('is-invalid');
        return false;
    } else {
        document.getElementById('email').classList.remove('is-invalid');
        return true;
    }
}

async function enviarCodigoRecuperacion() {
    const email = document.getElementById('email').value.trim();
    
    // Validaciones
    if (!email) {
        Swal.fire({
            title: 'Campo Requerido',
            text: 'Por favor ingresa tu correo electrónico',
            icon: 'warning',
            confirmButtonColor: '#E91E63'
        });
        return;
    }

    if (!validarEmail()) {
        Swal.fire({
            title: 'Correo Inválido',
            text: 'Por favor ingresa un correo electrónico válido',
            icon: 'error',
            confirmButtonColor: '#E91E63'
        });
        return;
    }

    try {
        // Mostrar loading
        Swal.fire({
            title: 'Enviando código...',
            text: 'Por favor espera mientras verificamos tu cuenta',
            allowOutsideClick: false,
            allowEscapeKey: false,
            showConfirmButton: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        // Enviar solicitud al backend
        const response = await fetch('http://localhost:3001/api/recovery/send-code', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email: email })
        });

        const resultado = await response.json();

        if (response.ok) {
            // Éxito - Mostrar mensaje y redirigir
            Swal.fire({
                title: '📧 ¡Código Enviado!',
                html: `
                    <p>Hemos enviado un código de verificación a:</p>
                    <strong style="color: #E91E63;">${email}</strong>
                    <p style="margin-top: 15px; font-size: 14px; color: #666;">
                        El código expira en <strong>10 minutos</strong>. Revisa tu bandeja de entrada y spam.
                    </p>
                `,
                icon: 'success',
                confirmButtonText: 'Ingresar Código',
                confirmButtonColor: '#E91E63',
                allowOutsideClick: false
            }).then(() => {
                // Redirigir a la página de ingreso de código
                window.location.href = `/verificar-codigo?email=${encodeURIComponent(email)}`;
            });
        } else {
            // Error del servidor
            Swal.fire({
                title: 'Error',
                text: resultado.message || 'No se pudo enviar el código. Inténtalo más tarde.',
                icon: 'error',
                confirmButtonColor: '#E91E63'
            });
        }

    } catch (error) {
        console.error('Error al enviar código:', error);
        Swal.fire({
            title: 'Error de Conexión',
            text: 'No se pudo conectar con el servidor. Verifica tu conexión a internet.',
            icon: 'error',
            confirmButtonColor: '#E91E63'
        });
    }
}

// Función para ir al login
function irAlLogin() {
    window.location.href = '/login';
}