import express from 'express';
import { crearApartado, entregarApartado } from '../controllers/apartadoController.js';
import Apartado from '../models/Apartado.js';

const router = express.Router();

// 1. OBTENER TODOS LOS APARTADOS (Que no estén entregados)
router.get('/', async (req, res) => {
  try {
    const apartados = await Apartado.find({ estado: { $ne: 'ENTREGADO' } });
    res.json(apartados);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener los apartados' });
  }
});

// 2. CREAR UN NUEVO APARTADO Y REGISTRAR ABONO
router.post('/', crearApartado);

// 3. ENTREGAR APARTADO, COBRAR FALTANTE Y SUMAR A VENTAS (CHEMAS)
router.post('/:id/entregar', entregarApartado);

// 4. CAMBIAR EL ESTADO DEL APARTADO (Ej: EN_CAMINO, PARA_ENTREGAR)
router.put('/:id/estado', async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;
    await Apartado.findByIdAndUpdate(id, { estado });
    res.json({ mensaje: 'Estado actualizado correctamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar el estado' });
  }
});

// 5. ELIMINAR UN APARTADO POR COMPLETO
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await Apartado.findByIdAndDelete(id);
    res.json({ mensaje: 'Apartado eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar el apartado' });
  }
});

export default router;