/**
 * asesoria.js — Formulario de Asesoría | Zona Cliente
 * Maneja el envío del formulario de contacto/asesoría de la tienda.
 */

// ── Toast container (crea el contenedor si no existe) ────────
if (!document.getElementById('toastContainer')) {
  const container = document.createElement('div');
  container.id = 'toastContainer';
  container.className = 'toast-container position-fixed top-0 end-0 p-3';
  container.style.zIndex = '9999';
  document.body.appendChild(container);
}

/**
 * Muestra un toast de notificación.
 * @param {string} mensaje - Texto a mostrar.
 * @param {'success'|'error'|'warning'} tipo - Tipo de notificación.
 */
function mostrarToast(mensaje, tipo = 'success') {
  const container = document.getElementById('toastContainer');
  const iconos = {
    success: '<i class="fas fa-check-circle text-success me-2"></i>',
    error:   '<i class="fas fa-times-circle text-danger me-2"></i>',
    warning: '<i class="fas fa-exclamation-triangle text-warning me-2"></i>'
  };
  const colores = {
    success: 'border-success',
    error:   'border-danger',
    warning: 'border-warning'
  };

  const toastId  = 'toast-' + Date.now();
  const toastHtml = `
    <div id="${toastId}" class="toast align-items-center bg-white border-start border-4 ${colores[tipo]}" role="alert">
      <div class="d-flex">
        <div class="toast-body d-flex align-items-center">
          ${iconos[tipo]}
          <span>${mensaje}</span>
        </div>
        <button type="button" class="btn-close me-2 m-auto" data-bs-dismiss="toast"></button>
      </div>
    </div>
  `;
  container.insertAdjacentHTML('beforeend', toastHtml);

  const toastEl = document.getElementById(toastId);
  const toast   = new bootstrap.Toast(toastEl, { delay: 5000 });
  toast.show();

  toastEl.addEventListener('hidden.bs.toast', () => toastEl.remove());
}

/**
 * Envía el formulario de asesoría al API.
 * Conectado via onsubmit="enviarConsultaAsesoria(event)" en el HTML.
 * @param {Event} event
 */
async function enviarConsultaAsesoria(event) {
  event.preventDefault();

  const btn       = document.getElementById('btnEnviarAsesoria');
  const btnText   = document.getElementById('btnAsesoriaText');
  const btnSpinner= document.getElementById('btnAsesoriaSpinner');

  const nombre  = document.getElementById('asesoriaName').value.trim();
  const email   = document.getElementById('asesoriaEmail').value.trim();
  const mensaje = document.getElementById('asesoriaMensaje').value.trim();

  // Validaciones
  if (!nombre || nombre.length < 2) {
    mostrarToast('Por favor ingresa tu nombre', 'warning');
    return;
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    mostrarToast('Por favor ingresa un email válido', 'warning');
    return;
  }
  if (!mensaje || mensaje.length < 10) {
    mostrarToast('El mensaje debe tener al menos 10 caracteres', 'warning');
    return;
  }

  // Estado de carga
  btn.disabled = true;
  btnText.textContent = 'Enviando...';
  btnSpinner.classList.remove('d-none');

  try {
    const response = await fetch('/api/contacto/asesoria', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre, email, mensaje })
    });

    const data = await response.json();

    if (response.ok && data.success) {
      mostrarToast('¡Mensaje enviado exitosamente! Te responderemos pronto.', 'success');
      document.getElementById('formAsesoria').reset();
    } else {
      throw new Error(data.message || 'Error al enviar');
    }
  } catch (error) {
    console.error('Error asesoría:', error);
    mostrarToast('Error al enviar: ' + error.message, 'error');
  } finally {
    btn.disabled = false;
    btnText.textContent = 'Enviar Mensaje';
    btnSpinner.classList.add('d-none');
  }
}
