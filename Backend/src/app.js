const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ quiet: true });

const app = express();
app.use(cors({
  origin: ['http://localhost:3001', 'http://127.0.0.1:3001', 'http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
app.use(express.json());

// ✅ SERVIR ARCHIVOS ESTÁTICOS DEL FRONTEND
app.use(express.static(path.join(__dirname, '../../Frontend')));

// ✅ RUTAS DE LA API CENTRALIZADAS
const apiRouter = require('./Routes/apiRouter');
app.use('/api', apiRouter);


// ✅ RUTA PRINCIPAL Y RUTAS SPA: Servir siempre agroconecta.html (Shell)
// El router del frontend manejará la lógica de qué vista inyectar
const clientShell = path.join(__dirname, '../../Frontend/html/cliente/agroconecta.html');

app.get([
  '/', 
  '/agroconecta', 
  '/login', 
  '/registro', 
  '/mi-cuenta', 
  '/checkout', 
  '/producto', 
  '/recuperar-contrasena', 
  '/verificar-codigo'
], (req, res) => {
  res.sendFile(clientShell);
});

// Webmanifest desde la ubicación correcta
app.get('/site.webmanifest', (req, res) => {
  res.sendFile(path.join(__dirname, '../../Frontend/site.webmanifest'));
});

// Favicon
app.get('/favicon.ico', (req, res) => {
  res.sendFile(path.join(__dirname, '../../Frontend/icono/favicon.ico'));
});

app.get('/panel-control', (req, res) => {
  res.sendFile(path.join(__dirname, '../../Frontend/html/panel_control/menu.html'));
});

app.get('/panel-login', (req, res) => {
  res.sendFile(path.join(__dirname, '../../Frontend/html/panel_control/login-panel.html'));
});

app.get('/panel-control/{*splat}', (req, res) => {
  res.sendFile(path.join(__dirname, '../../Frontend/html/panel_control/menu.html'));
});

// ✅ FALLBACK: Si no encuentra una ruta, servir agroconecta.html
app.use((req, res) => {
  // Solo para rutas que no son de API ni archivos estáticos
  if (!req.path.startsWith('/api/') && !req.path.includes('.')) {
    res.sendFile(path.join(__dirname, '../../Frontend/html/cliente/agroconecta.html'));
  } else if (req.path.startsWith('/api/')) {
    res.status(404).json({ message: 'Ruta de API no encontrada' });
  } else {
    res.status(404).send('Archivo no encontrado');
  }
});

const PORT = process.env.PORT || 3001;

// Exportar para pruebas con supertest
module.exports = app;

app.listen(PORT, async () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
  console.log(`📁 Sirviendo frontend desde: ${path.join(__dirname, '../../Frontend')}`);

  const urlTienda = `http://localhost:${PORT}/`;
  const urlPanel = `http://localhost:${PORT}/html/panel_control/login-panel.html`;

  try {
    // ✅ IMPORT DINÁMICO para open (compatible con CommonJS)
    const open = (await import('open')).default;

    // Abrir tienda principal
    await open(urlTienda);
    console.log(`🌐 Tienda abierta en:     ${urlTienda}`);

    // Pequeño delay para que el navegador no bloquee la 2ª pestaña
    await new Promise(resolve => setTimeout(resolve, 800));

    // Abrir panel de administración
    await open(urlPanel);
    console.log(`🛠️  Panel admin abierto en: ${urlPanel}`);

  } catch (error) {
    console.log(`⚠️ No se pudo abrir automáticamente. Abre manualmente:`);
    console.log(`   🌐 Tienda: ${urlTienda}`);
    console.log(`   🛠️  Panel: ${urlPanel}`);

    // ✅ FALLBACK: Comando del sistema para Windows
    const { exec } = require('child_process');
    exec(`start "" "${urlTienda}" & start "" "${urlPanel}"`, (execError) => {
      if (!execError) {
        console.log(`🌐 Ambas pestañas abiertas con comando Windows`);
      }
    });
  }
});
