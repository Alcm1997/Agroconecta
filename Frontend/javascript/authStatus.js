document.addEventListener('DOMContentLoaded', initAuthUI);

// -------- Utilidades --------
function getToken() {
  const t =
    localStorage.getItem('token') ||
    localStorage.getItem('token_cliente') ||
    localStorage.getItem('cliente_token') ||
    sessionStorage.getItem('token') ||
    sessionStorage.getItem('token_cliente') ||
    sessionStorage.getItem('cliente_token') ||
    '';
  return (t || '').replace(/^"|"$/g, '').trim();
}
function parseJSON(v) { try { return JSON.parse(v); } catch { return null; } }
function firstWord(s) { return (s || '').trim().split(/\s+/)[0] || ''; }

function pickUser(r) {
  if (!r) return null;
  if (r.cliente) return r.cliente;
  if (r.data && r.data.cliente) return r.data.cliente;
  if (r.data) return r.data;
  return r;
}

function buildDisplayName(user) {
  const tipo = (user?.tipo_cliente || '').toLowerCase();
  if (tipo.includes('natural')) {
    const n = firstWord(user?.nombres);
    const a = firstWord(user?.apellidos);
    return `${n} ${a}`.trim() || 'Cliente';
  }
  return (user?.razon_social || user?.nombre_comercial || 'Cliente').trim();
}

function mapToCliente(u) {
  return {
    id_cliente: u?.id_cliente ?? u?.id ?? u?.idClient,
    tipo_cliente: u?.tipo_cliente,
    nombres: u?.nombres,
    apellidos: u?.apellidos,
    razon_social: u?.razon_social,
    nombre_comercial: u?.nombre_comercial,
    correo: u?.correo || u?.email
  };
}

// -------- API perfil --------
async function fetchPerfil(token) {
  const urls = [
    'http://localhost:3001/api/client/profile',
    '/api/tienda/clientes/me',
    '/api/clientes/me',
    '/api/tienda/cliente/perfil'
  ];
  for (const url of urls) {
    try {
      const r = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      if (r.ok) return pickUser(await r.json());
    } catch (_) {}
  }
  return null;
}

// -------- Logout --------
function ensureLogout() {
  ['token','token_cliente','cliente_token','cliente','cliente_data','perfil_cliente','user','usuario']
    .forEach(k => { localStorage.removeItem(k); sessionStorage.removeItem(k); });
  window.location.href = '/html/loginagroconecta.html';
}

// -------- UI --------
async function initAuthUI() {
  const token = getToken();
  const clientNameEl = document.getElementById('clientName');       // checkout
  const clientDropdown = document.getElementById('clientDropdown'); // checkout
  const loginButton = document.getElementById('loginButton');       // agroconecta

  if (!token) {
    if (clientNameEl) clientNameEl.textContent = 'Invitado';
    if (loginButton) {
      loginButton.style.display = '';
      loginButton.onclick = () => (window.location.href = '/html/loginagroconecta.html');
    }
    bindLogoutLinks();
    return;
  }

  // Estado de carga
  if (clientNameEl) clientNameEl.textContent = 'Cargando...';
  if (loginButton) loginButton.style.display = 'none';
  if (clientDropdown) {
    clientDropdown.style.display = 'inline-flex';
    clientDropdown.classList.remove('d-none');
  }

  // Reusar cache o pedir al backend
  let user = parseJSON(localStorage.getItem('cliente')) ||
             parseJSON(localStorage.getItem('cliente_data'));
  if (!user) user = await fetchPerfil(token);

  if (!user) {
    // Token inválido: vuelve al estado de invitado
    if (clientNameEl) clientNameEl.textContent = 'Invitado';
    if (loginButton) {
      loginButton.style.display = '';
      loginButton.onclick = () => (window.location.href = '/html/loginagroconecta.html');
    }
    bindLogoutLinks();
    return;
  }

  const cliente = mapToCliente(user);
  localStorage.setItem('cliente', JSON.stringify(cliente));
  const displayName = buildDisplayName(cliente);

  if (clientNameEl && clientDropdown) {
    // Caso checkout: solo rellenar
    clientNameEl.textContent = displayName;
  } else if (loginButton) {
    // Caso agroconecta: reemplazar botón de login por dropdown amarillo
    const wrapper = document.createElement('div');
    wrapper.className = 'dropdown me-2';
    wrapper.id = 'authMenu';
    wrapper.innerHTML = `
      <button class="btn login-btn dropdown-toggle" type="button" id="userMenuButton" data-bs-toggle="dropdown" aria-expanded="false">
        <i class="fas fa-user me-1"></i> ${displayName}
      </button>
      <ul class="dropdown-menu dropdown-menu-end" aria-labelledby="userMenuButton">
        <li><a class="dropdown-item" href="/html/miCuenta.html"><i class="fas fa-user-cog me-2"></i>Mi Cuenta</a></li>
        <li><hr class="dropdown-divider"></li>
        <li><a class="dropdown-item" href="#" id="logoutButton"><i class="fas fa-sign-out-alt me-2"></i>Cerrar Sesión</a></li>
      </ul>
    `;
    loginButton.parentNode.replaceChild(wrapper, loginButton);
    wrapper.querySelector('#logoutButton').addEventListener('click', (e) => {
      e.preventDefault();
      ensureLogout();
    });
  }

  bindLogoutLinks();
}

function bindLogoutLinks() {
  document.querySelectorAll('#logoutButton,#logoutNav,[data-action="logout"]').forEach(a => {
    a.addEventListener('click', (e) => { e.preventDefault(); ensureLogout(); });
  });
}