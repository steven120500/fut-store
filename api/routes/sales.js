import express from 'express';
import Sale from '../models/Sale.js';

const router = express.Router();

// 📥 POST: Guardar una nueva venta desde el modal
router.post('/', async (req, res) => {
  try {
    const newSale = await Sale.create({
      cedula: req.body.cedula,
      nombre: req.body.nombre,
      numero: req.body.numero,
      totalPago: Number(req.body.totalPago) || 0,
      costoEnvio: Number(req.body.costoEnvio) || 0,
      montoTotal: Number(req.body.montoTotal) || 0,
      tallaVendida: req.body.tallaVendida,
      cantidad: Number(req.body.cantidad) || 1,
      productoId: req.body.productoId,
      productoNombre: req.body.productoNombre,
      vendedor: req.body.vendedor || req.headers['x-user'] || 'Empleado',
      fecha: req.body.fecha ? new Date(req.body.fecha) : new Date()
    });

    res.status(201).json({ success: true, sale: newSale });
  } catch (error) {
    console.error("Error al guardar venta:", error);
    res.status(500).json({ error: "Error interno al registrar la venta" });
  }
});

// 📤 GET: Obtener todas las ventas (Con filtros por fecha o vendedor si se necesitan)
router.get('/', async (req, res) => {
  try {
    const { vendedor, fechaInicio, fechaFin } = req.query;
    let query = {};

    if (vendedor) query.vendedor = vendedor;
    if (fechaInicio && fechaFin) {
      query.fecha = {
        $gte: new Date(fechaInicio),
        $lte: new Date(fechaFin)
      };
    }

    // Ordenar de la más reciente a la más antigua
    const sales = await Sale.find(query).sort({ fecha: -1 }).lean();
    res.json(sales);
  } catch (error) {
    console.error("Error al obtener ventas:", error);
    res.status(500).json({ error: "Error al cargar el historial de ventas" });
  }
});

// 📊 GET /ranking: Obtener métricas de rendimiento por empleado
router.get('/ranking', async (req, res) => {
  try {
    const ranking = await Sale.aggregate([
      {
        $group: {
          _id: "$vendedor",
          totalVentas: { $sum: 1 },                  // Cantidad de transacciones
          totalPrendas: { $sum: "$cantidad" },       // Cantidad de chemas vendidas
          dineroGenerado: { $sum: "$totalPago" },    // Dinero solo en chemas
          enviosGenerados: { $sum: "$costoEnvio" },  // Dinero en envíos
          montoTotal: { $sum: "$montoTotal" }        // Total bruto
        }
      },
      { $sort: { totalPrendas: -1, dineroGenerado: -1 } } // Ordenar por el que más chemas vendió
    ]);

    res.json(ranking);
  } catch (error) {
    console.error("Error en ranking:", error);
    res.status(500).json({ error: "Error al generar el ranking de empleados" });
  }
});

// 🔄 DELETE: Reiniciar todas las ventas (Cierre de mes)
// ⚠️ IMPORTANTE: Debe colocarse ANTES de la ruta '/:id' para que Express no confunda la palabra 'reset' con un ID.
router.delete('/reset/all', async (req, res) => {
  try {
    await Sale.deleteMany({});
    res.json({ success: true, message: "Todas las ventas han sido reseteadas para el nuevo mes." });
  } catch (error) {
    console.error("Error al resetear ventas:", error);
    res.status(500).json({ error: "Error al vaciar las ventas del sistema." });
  }
});

// 🗑️ DELETE: Eliminar una venta individual por ID
router.delete('/:id', async (req, res) => {
  try {
    await Sale.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Venta eliminada" });
  } catch (error) {
    res.status(500).json({ error: "Error al eliminar la venta" });
  }
});

export default router;