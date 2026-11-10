import express from 'express';
import { crearApartado, entregarApartado, cambiarEstadoApartado, eliminarApartado } from '../controllers/apartadoController.js';
import Apartado from '../models/Apartado.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();
router.use(requireAuth); // todo el tablero de apartados es solo para personal

// 1. OBTENER TODOS LOS APARTADOS (que no estén entregados)
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

// 3. ENTREGAR APARTADO, COBRAR FALTANTE Y SUMAR A VENTAS
router.post('/:id/entregar', entregarApartado);

// 4. CAMBIAR EL ESTADO (PENDIENTE, EN_CAMINO, PARA_ENTREGAR)
router.put('/:id/estado', cambiarEstadoApartado);

// 5. ELIMINAR: devuelve el stock y borra SOLO el abono de este apartado
router.delete('/:id', eliminarApartado);

export default router;
