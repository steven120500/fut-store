
import express from 'express';
import Expense from '../models/Expense.js';
import { requireRole, requireSuper, actorName } from '../middleware/auth.js';

const router = express.Router();

// 📥 POST: Agregar un nuevo gasto
router.post('/', requireRole('edit'), async (req, res) => {
  try {
    // Solo campos permitidos (antes se guardaba cualquier cosa que llegara)
    const monto = Number(req.body.monto);
    if (!Number.isFinite(monto) || monto <= 0) return res.status(400).json({ error: "Monto inválido" });
    const descripcion = String(req.body.descripcion ?? '').trim().slice(0, 300);
    if (!descripcion) return res.status(400).json({ error: "La descripción es obligatoria" });
    let fecha = new Date();
    if (req.body.fecha) {
      const f = new Date(req.body.fecha);
      if (Number.isNaN(f.getTime())) return res.status(400).json({ error: "Fecha inválida" });
      fecha = f;
    }
    const newExpense = await Expense.create({
      categoria: String(req.body.categoria ?? ''),
      descripcion,
      monto,
      fecha,
      registradoPor: actorName(req, 'Admin')
    });
    res.status(201).json({ success: true, expense: newExpense });
  } catch (error) {
    if (error?.name === 'ValidationError') return res.status(400).json({ error: "Categoría inválida" });
    res.status(500).json({ error: "Error al registrar el gasto" });
  }
});

// 📤 GET: Obtener todos los gastos
router.get('/', requireSuper, async (req, res) => {
  try {
    const expenses = await Expense.find().sort({ fecha: -1 }).lean();
    res.json(expenses);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener los gastos" });
  }
});

// 🗑️ DELETE: Eliminar un gasto por ID
router.delete('/:id', requireSuper, async (req, res) => {
  try {
    const deleted = await Expense.findByIdAndDelete(req.params.id).catch(() => null);
    if (!deleted) return res.status(404).json({ error: "Gasto no encontrado" });
    res.json({ success: true, message: "Gasto eliminado" });
  } catch (error) {
    res.status(500).json({ error: "Error al eliminar el gasto" });
  }
});

export default router;