import express from 'express';
import Sale from '../models/Sale.js';

const router = express.Router();

const VENDEDORES_OFICIALES = [
  'LaR Delflow',
  'Justin Lobo',
  'Carlos Lobo',
  'Alonso Lobo',
  'Dylan Gomez',
  'Steven Corrales'
];

const normalizarVendedor = (inputName) => {
  if (!inputName) return 'Steven Corrales';
  const cleanInput = inputName.trim().toLowerCase();
  const match = VENDEDORES_OFICIALES.find(v => v.toLowerCase() === cleanInput || v.toLowerCase().startsWith(cleanInput));
  if (match) return match;
  return inputName
    .trim()
    .toLowerCase()
    .replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase());
};

// 📥 POST: Guardar venta
router.post('/', async (req, res) => {
  try {
    const rawVendedor = req.body.vendedor || req.headers['x-user'] || 'Steven Corrales';
    const vendedorEstandarizado = normalizarVendedor(rawVendedor);

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
      vendedor: vendedorEstandarizado,
      fecha: req.body.fecha ? new Date(req.body.fecha) : new Date(),
      archivado: false
    });

    res.status(201).json({ success: true, sale: newSale });
  } catch (error) {
    console.error("Error al guardar venta:", error);
    res.status(500).json({ error: "Error interno al registrar la venta" });
  }
});

// 📤 GET: Obtener ventas (Contaduría ve todo)
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

    const sales = await Sale.find(query).sort({ fecha: -1 }).lean();
    res.json(sales);
  } catch (error) {
    console.error("Error al obtener ventas:", error);
    res.status(500).json({ error: "Error al cargar el historial de ventas" });
  }
});

// 📊 GET /ranking: Solo suma las no archivadas
router.get('/ranking', async (req, res) => {
  try {
    const ranking = await Sale.aggregate([
      { $match: { archivado: { $ne: true } } },
      {
        $group: {
          _id: "$vendedor",
          totalVentas: { $sum: 1 },                  
          totalPrendas: { $sum: "$cantidad" },       
          dineroGenerado: { $sum: "$totalPago" },    
          enviosGenerados: { $sum: "$costoEnvio" },  
          montoTotal: { $sum: "$montoTotal" }        
        }
      },
      { $sort: { totalPrendas: -1, dineroGenerado: -1 } } 
    ]);

    res.json(ranking);
  } catch (error) {
    console.error("Error en ranking:", error);
    res.status(500).json({ error: "Error al generar el ranking de empleados" });
  }
});

// 🔄 DELETE: Cierre de mes (Archivar en vez de borrar para conservar contaduría)
router.delete('/reset/all', async (req, res) => {
  try {
    await Sale.updateMany({}, { $set: { archivado: true } });
    res.json({ success: true, message: "Ranking reseteado correctamente." });
  } catch (error) {
    console.error("Error al resetear ventas:", error);
    res.status(500).json({ error: "Error al vaciar las ventas del sistema." });
  }
});

// 🗑️ DELETE: Eliminar venta por ID
router.delete('/:id', async (req, res) => {
  try {
    await Sale.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Venta eliminada" });
  } catch (error) {
    res.status(500).json({ error: "Error al eliminar la venta" });
  }
});

export default router;