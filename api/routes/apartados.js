import express from 'express';
import { crearApartado, entregarApartado, cambiarEstadoApartado, eliminarApartado } from '../controllers/apartadoController.js';
import Apartado from '../models/Apartado.js';
import Sale from '../models/Sale.js';
import { requireAuth } from '../middleware/auth.js';

const RESTOCK_CLIENTE = 'FUTSTORE RE-STOCK'; // encargos internos del tablero de Re-Stock: no son ventas

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

// 1b. APARTADOS QUE CUENTAN PARA LA COMISIÓN DEL MES
//     La comisión se gana al APARTAR (de stock o por encargo), no al entregar. Se excluyen los
//     encargos internos de Re-Stock y lo que ya se archivó en un cierre de mes.
router.get('/comision', async (req, res) => {
  try {
    const apartados = await Apartado.find(
      { comisionArchivada: { $ne: true }, cliente: { $ne: RESTOCK_CLIENTE } },
      {
        vendedor: 1, cliente: 1, estado: 1, fechaCreacion: 1,
        'productos.tipoPedido': 1, 'productos.talla': 1, 'productos.cantidad': 1, 'productos.version': 1,
        'productos.descripcionManual': 1, 'productos.busqueda': 1, 'productos.productoObj.name': 1, 'productos.productoObj.type': 1,
      }
    ).lean();

    // Apartados entregados ANTES de este cambio: si su venta ya se archivó en un cierre, su comisión ya se pagó
    const entregados = apartados.filter((a) => a.estado === 'ENTREGADO').map((a) => a._id);
    const archivados = entregados.length
      ? new Set((await Sale.find({ apartadoId: { $in: entregados }, archivado: true }, { apartadoId: 1 }).lean()).map((s) => String(s.apartadoId)))
      : new Set();

    res.json(apartados.filter((a) => !archivados.has(String(a._id))));
  } catch (error) {
    console.error('Error al obtener apartados para comisión:', error);
    res.status(500).json({ error: 'Error al calcular la comisión de apartados' });
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
