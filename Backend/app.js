const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(cors({
  origin: ['http://localhost:3001', 'http://127.0.0.1:3001', 'http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
app.use(express.json());

// ✅ SERVIR ARCHIVOS ESTÁTICOS DEL FRONTEND
app.use(express.static(path.join(__dirname, '../Frontend')));

// ✅ RUTAS DE LA API
const clientRoutes = require('./Routes/clientRoutes');
const recoveryRoutes = require('./Routes/recoveryRoutes');
const cargoRoutes = require('./Routes/cargoRoutes');
const departamentoRoutes = require('./Routes/departamentoRoutes');
const distritoRoutes = require('./Routes/distritoRoutes');
const authPanelRoutes = require('./Routes/authPanelRoutes');
const userRoutes = require('./Routes/userRoutes');
const clientPanelRoutes = require('./Routes/clientPanelRoutes');
const categoriaRoutes = require('./Routes/categoriaRoutes');
const unidadMedidaRoutes = require('./Routes/unidadMedidaRoutes');
// Importar rutas de productos
const productoRoutes = require('./Routes/productoRoutes');
const productoTiendaRoutes = require('./Routes/productoTiendaRoutes');
const pedidoTiendaRoutes = require('./Routes/pedidoTiendaRoutes');
const pedidoAdminRoutes = require('./Routes/pedidoAdminRoutes');
const carritoRoutes = require('./Routes/carritoRoutes');
const asesoriaRoutes = require('./Routes/asesoriaRoutes');
const transporteRoutes = require('./Routes/transporteRoutes');
const guiaRemisionRoutes = require('./Routes/guiaRemisionRoutes');
const reporteRoutes = require('./Routes/reporteRoutes');
const uploadRoutes = require('./Routes/uploadRoutes');




app.use('/api/client', clientRoutes);
app.use('/api/recovery', recoveryRoutes);
app.use('/api/cargo', cargoRoutes);
app.use('/api/departamentos', departamentoRoutes);
app.use('/api/distritos', distritoRoutes);
app.use('/api/panel/auth', authPanelRoutes);
app.use('/api/panel/users', userRoutes);
app.use('/api/panel/clients', clientPanelRoutes);
app.use('/api/panel/categorias', categoriaRoutes);
app.use('/api/panel/unidades-medida', unidadMedidaRoutes);
// Montar rutas de productos
app.use('/api/panel/productos', productoRoutes);
app.use('/api/panel/pedidos', pedidoAdminRoutes);
// Tienda (público/cliente)
app.use('/api/tienda/productos', productoTiendaRoutes);
app.use('/api/client/carrito', carritoRoutes);
app.use(pedidoTiendaRoutes);
// Asesoría gratuita
app.use('/api/contacto/asesoria', asesoriaRoutes);
app.use('/api/panel/asesorias', asesoriaRoutes);
// Transporte
app.use('/api/panel/transporte', transporteRoutes);
// Guías de Remisión
app.use('/api/panel/guias', guiaRemisionRoutes);
// Reportes
app.use('/api/panel/reportes', reporteRoutes);
// Subida de imágenes
app.use('/api/panel/upload', uploadRoutes);


// ✅ RUTA PRINCIPAL: SERVIR agroconecta.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../Frontend/html/agroconecta.html'));
});

// ✅ RUTAS ESPECÍFICAS PARA CADA PÁGINA
app.get('/agroconecta', (req, res) => {
  res.sendFile(path.join(__dirname, '../Frontend/html/agroconecta.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, '../Frontend/html/loginagroconecta.html'));
});

app.get('/registro', (req, res) => {
  res.sendFile(path.join(__dirname, '../Frontend/html/registroagroconecta.html'));
});

app.get('/mi-cuenta', (req, res) => {
  res.sendFile(path.join(__dirname, '../Frontend/html/miCuenta.html'));
});

app.get('/recuperar-contrasena', (req, res) => {
  res.sendFile(path.join(__dirname, '../Frontend/html/recuperarcontrasenaagroconecta.html'));
});

app.get('/verificar-codigo', (req, res) => {
  res.sendFile(path.join(__dirname, '../Frontend/html/verificarcodigoagroconecta.html'));
});

// Webmanifest desde la ubicación correcta
app.get('/site.webmanifest', (req, res) => {
  res.sendFile(path.join(__dirname, '../Frontend/site.webmanifest'));
});

// Favicon
app.get('/favicon.ico', (req, res) => {
  res.sendFile(path.join(__dirname, '../Frontend/icono/favicon.ico'));
});

app.get('/panel-control', (req, res) => {
  res.sendFile(path.join(__dirname, '../Frontend/html/panel_control/menu.html'));
});

app.get('/panel-control/*', (req, res) => {
  res.sendFile(path.join(__dirname, '../Frontend/html/panel_control/menu.html'));
});

// ✅ FALLBACK: Si no encuentra una ruta, servir agroconecta.html
app.use((req, res) => {
  // Solo para rutas que no son de API ni archivos estáticos
  if (!req.path.startsWith('/api/') && !req.path.includes('.')) {
    res.sendFile(path.join(__dirname, '../Frontend/html/agroconecta.html'));
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
  console.log(`📁 Sirviendo frontend desde: ${path.join(__dirname, '../Frontend')}`);

  const url = `http://localhost:${PORT}`;

  try {
    // ✅ IMPORT DINÁMICO para open (compatible con CommonJS)
    const open = (await import('open')).default;
    await open(url);
    console.log(`🌐 AgroConecta abierto automáticamente en: ${url}`);
    console.log(`✅ Página principal: agroconecta.html`);
  } catch (error) {
    console.log(`⚠️ No se pudo abrir automáticamente.`);
    console.log(`🔗 Abre manualmente: ${url}`);

    // ✅ FALLBACK: Comando del sistema para Windows
    const { exec } = require('child_process');
    exec(`start ${url}`, (execError) => {
      if (!execError) {
        console.log(`🌐 Navegador abierto con comando Windows`);
      }
    });
  }
});