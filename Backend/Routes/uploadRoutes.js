const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const authPanel = require('../Middleware/authPanel');

// Carpeta destino
const uploadDir = path.join(__dirname, '../../Frontend/imagenes_productos');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadDir),
    filename: (_req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        const unique = `prod_${Date.now()}_${Math.round(Math.random() * 1e6)}${ext}`;
        cb(null, unique);
    }
});

const fileFilter = (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Solo se permiten imágenes'), false);
};

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // 5 MB máximo
});

// POST /api/panel/upload/producto-imagen
router.post('/producto-imagen', authPanel, upload.single('imagen'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No se recibió ninguna imagen' });
    }
    const url = `/imagenes_productos/${req.file.filename}`;
    return res.json({ url });
});

// Manejo de errores de multer
router.use((err, _req, res, _next) => {
    if (err instanceof multer.MulterError || err.message) {
        return res.status(400).json({ message: err.message });
    }
    return res.status(500).json({ message: 'Error al subir archivo' });
});

module.exports = router;
