
import express from 'express';
import Expense from '../models/Expense.js';

const router = express.Router();

// 📥 POST: Agregar un nuevo gasto
router.post('/', async (req, res) => {
  try {
    const newExpense = await Expense.create({
      ...req.body,
      registradoPor: req.headers['x-user'] || 'Admin'
    });
    res.status(201).json({ success: true, expense: newExpense });
  } catch (error) {
    res.status(500).json({ error: "Error al registrar el gasto" });
  }
});

// 📤 GET: Obtener todos los gastos
router.get('/', async (req, res) => {
  try {
    const expenses = await Expense.find().sort({ fecha: -1 }).lean();
    res.json(expenses);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener los gastos" });
  }
});

// 🗑️ DELETE: Eliminar un gasto por ID
router.delete('/:id', async (req, res) => {
  try {
    await Expense.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Gasto eliminado" });
  } catch (error) {
    res.status(500).json({ error: "Error al eliminar el gasto" });
  }
});

export default router;