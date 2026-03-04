import express from 'express';
const router = express.Router();
// 1. 👇 TIENES QUE IMPORTAR TU MODELO AQUÍ 👇
import History from '../models/History.js'; 

// GET: Obtener historial completo
router.get('/', async (req, res) => {
    try {
        // 2. 👇 DESCOMENTAMOS ESTO PARA QUE BUSQUE EN LA BASE DE DATOS 👇
        const history = await History.find().sort({ createdAt: -1 });
        res.json(history);
    } catch (err) {
        console.error('Error al obtener historial:', err);
        res.status(500).json({ error: 'Error al obtener historial' });
    }
});

/* ========= DELETE: Limpiar historial (solo super) ========= */
router.delete('/', async (req, res) => {
    try {
        // Aquí podrías agregar un check de roles si lo necesitas
        await History.deleteMany({}); // 👈 También lo descomentamos para que funcione
        res.json({ ok: true, message: "Historial eliminado" });
    } catch (err) {
        console.error('Error al limpiar historial:', err);
        res.status(500).json({ error: 'Error al limpiar historial' });
    }
});

export default router;