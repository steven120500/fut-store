import express from 'express';
const router = express.Router();
import History from '../models/History.js'; 

// GET: Obtener historial con filtro de fecha opcional
router.get('/', async (req, res) => {
    try {
        const { date } = req.query; // 👈 Capturamos la fecha que manda el frontend
        let query = {};

        // 🛠️ LÓGICA DE FILTRO POR FECHA
        if (date) {
            const start = new Date(date);
            start.setUTCHours(0, 0, 0, 0);
            
            const end = new Date(date);
            end.setUTCHours(23, 59, 59, 999);

            // Filtramos los registros que estén dentro de ese día
            query.date = { $gte: start, $lte: end };
        }

        // Ejecutamos la búsqueda con el filtro (o vacía si no hay fecha)
        const history = await History.find(query).sort({ date: -1 });
        res.json(history);
    } catch (err) {
        console.error('Error al obtener historial:', err);
        res.status(500).json({ error: 'Error al obtener historial' });
    }
});

/* ========= DELETE: Limpiar historial (solo super) ========= */
router.delete('/', async (req, res) => {
    try {
        await History.deleteMany({});
        res.json({ ok: true, message: "Historial eliminado" });
    } catch (err) {
        console.error('Error al limpiar historial:', err);
        res.status(500).json({ error: 'Error al limpiar historial' });
    }
});

export default router;