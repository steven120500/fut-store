import express from 'express';
const router = express.Router();
// Importa tu modelo de Historia aquí (ejemplo: import History from '../models/History.js')

// GET: Obtener historial completo
router.get('/', async (req, res) => {
    try {
        // Asumiendo que usas Mongoose
        // const history = await History.find().sort({ createdAt: -1 });
        // res.json(history);
        res.json([]); // Temporal si aún no conectas el modelo
    } catch (err) {
        res.status(500).json({ error: 'Error al obtener historial' });
    }
});

/* ========= DELETE: Limpiar historial (solo super) ========= */
router.delete('/', async (req, res) => {
    try {
        // Tu lógica de validación de SuperUser aquí
        // await History.deleteMany({});
        res.json({ ok: true });
    } catch (err) {
        console.error('Error al limpiar historial:', err);
        res.status(500).json({ error: 'Error al limpiar historial' });
    }
});

// ⚠️ ESTA ES LA LÍNEA QUE RENDER DICE QUE FALTA ⚠️
export default router;