import express from 'express';
import Sale from '../models/Sale.js';
import Product from '../models/Product.js';
import History from '../models/History.js';
import { adjustMany } from '../utils/stock.js';
import { asString } from '../utils/security.js';
import { requireAuth, requireRole, actorName } from '../middleware/auth.js';

const router = express.Router();
router.use(requireAuth); // ventas: solo personal

const VENDEDORESOFICIALES = [
  'LaR Delflow',
  'Justin Lobo',
  'Carlos Lobo',
  'Bety',
  'Dylan Gomez',
  'Steven Corrales'
];

const normalizarVendedor = (inputName) => {
  if (!inputName) return 'Steven Corrales';
  let cleanInput = inputName.trim().toLowerCase();
  
  if (cleanInput.includes('alonso') || cleanInput.includes('alonso lobo')) {
    return 'Bety';
  }

  const match = VENDEDORESOFICIALES.find(v => v.toLowerCase() === cleanInput || v.toLowerCase().startsWith(cleanInput));
  if (match) return match;
  return inputName
    .trim()
    .toLowerCase()
    .replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase());
};

// 📥 POST: Guardar venta con DESCUENTO DE INVENTARIO Y REGISTRO EN HISTORIAL
router.post('/', async (req, res) => {
  try {
    const rawVendedor = asString(req.body.vendedor) || actorName(req, 'Steven Corrales');
    const vendedorEstandarizado = normalizarVendedor(rawVendedor);
    const productosVendidos = Array.isArray(req.body.productos) ? req.body.productos : [];

    // --- Validaciones ---
    for (const p of productosVendidos) {
      const c = Number(p?.cantidad ?? 1);
      if (!Number.isInteger(c) || c < 1 || c > 500) {
        return res.status(400).json({ error: 'Cantidad inválida en uno de los productos' });
      }
    }
    let fecha = new Date();
    if (req.body.fecha) {
      const f = new Date(req.body.fecha);
      if (Number.isNaN(f.getTime())) return res.status(400).json({ error: 'Fecha inválida' });
      if (f.getTime() > Date.now() + 36 * 3600 * 1000) return res.status(400).json({ error: 'La fecha de la venta no puede ser futura' });
      fecha = f;
    }

    const cantidadTotal = productosVendidos.length > 0
      ? productosVendidos.reduce((acc, p) => acc + (Number(p.cantidad) || 0), 0)
      : Math.max(1, Math.trunc(Number(req.body.cantidad) || 1));

    const resumenChemas = asString(req.body.productoNombre)
      || productosVendidos.map((p) => `${p.cantidad}x ${p.nombre} (${p.talla})`).join(' + ')
      || 'Camiseta';

    // 1) Primero se guarda la venta: si faltan datos, NO se toca el inventario
    const newSale = await Sale.create({
      cedula: String(req.body.cedula ?? ''),
      nombre: String(req.body.nombre ?? ''),
      numero: String(req.body.numero ?? ''),
      totalPago: Number(req.body.totalPago) || 0,
      costoEnvio: Number(req.body.costoEnvio) || 0,
      direccionEnvio: asString(req.body.direccionEnvio),
      montoTotal: Number(req.body.montoTotal) || 0,
      tallaVendida: asString(req.body.tallaVendida) || String(productosVendidos[0]?.talla || 'N/A'),
      cantidad: cantidadTotal,
      productoNombre: resumenChemas,
      productos: productosVendidos,
      vendedor: vendedorEstandarizado,
      fecha,
      archivado: false,
    });

    // 2) Descuento de inventario atómico
    const ajustes = await adjustMany(
      productosVendidos
        .filter((p) => p?.tipoVenta === 'stock' && p.productoId)
        .map((p) => ({ productId: p.productoId, talla: p.talla, delta: -(Number(p.cantidad) || 1), nombre: p.nombre }))
    );
    const fallidos = ajustes.filter((a) => !a.ok);
    if (fallidos.length) console.warn('⚠️ Venta registrada pero sin descontar stock en:', fallidos.map((f) => `${f.nombre} (${f.talla}): ${f.reason}`).join(' | '));

    // 3) Historial
    await History.create({
      user: vendedorEstandarizado,
      action: 'registró venta rápida',
      item: `Cliente: ${newSale.nombre} (${cantidadTotal} unds)`,
      date: new Date(),
      details: `Detalle: ${resumenChemas} | Total: ₡${(Number(req.body.montoTotal) || 0).toLocaleString()}${fallidos.length ? ` | ⚠️ Sin stock descontado: ${fallidos.map((f) => `${f.nombre} (${f.talla})`).join(', ')}` : ''}`,
    });

    res.status(201).json({ success: true, sale: newSale, stockWarnings: fallidos.map((f) => ({ nombre: f.nombre, talla: f.talla, motivo: f.reason })) });
  } catch (error) {
    console.error("Error al guardar venta:", error);
    if (error?.name === 'ValidationError') return res.status(400).json({ error: 'Faltan datos de la venta (cédula, nombre o número)' });
    res.status(500).json({ error: "Error interno al registrar la venta" });
  }
});

// 📤 GET: Obtener ventas (Soporta ?includeArchived=true para el Balance General)
router.get('/', async (req, res) => {
  try {
    const { vendedor, fechaInicio, fechaFin, includeArchived } = req.query;
    let query = {};

    // Si no piden explícitamente los archivados, traemos solo los activos del mes
    if (includeArchived !== 'true') {
      query.archivado = false;
    }

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

// 📊 TOP PRODUCTOS VENDIDOS POR MES
router.get('/top-products', async (req, res) => {
  try {
    const { year, month } = req.query; 
    const targetYear = year ? parseInt(year) : new Date().getFullYear();
    const targetMonth = month ? parseInt(month) - 1 : new Date().getMonth();

    const startDate = new Date(targetYear, targetMonth, 1);
    const endDate = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59);

    const topProducts = await Sale.aggregate([
      {
        $match: {
          fecha: { $gte: startDate, $lte: endDate }
        }
      },
      { $unwind: "$productos" },
      {
        $group: {
          _id: {
            idRef: "$productos.productoId",
            nombreRef: { $toUpper: "$productos.nombre" }
          },
          nombre: { $first: "$productos.nombre" }, 
          tipo: { $first: "$productos.type" },
          imagen: { $first: "$productos.imageSrc" }, 
          totalUnidadesVendidas: { $sum: { $convert: { input: "$productos.cantidad", to: "int", onError: 1, onNull: 1 } } },
          totalDineroGenerado: { $sum: { $convert: { input: "$productos.precioTotal", to: "double", onError: 0, onNull: 0 } } }
        }
      },
      { $sort: { totalUnidadesVendidas: -1, totalDineroGenerado: -1 } },
      { $limit: 15 }
    ]);

    res.json(topProducts);
  } catch (error) {
    console.error("Error al generar Top Productos:", error);
    res.status(500).json({ error: "Error al calcular los productos más vendidos." });
  }
});

// 🔄 RUTA DE RANKING
router.get('/ranking', async (req, res) => {
  try {
    await Sale.updateMany(
      { vendedor: { $regex: /alonso/i } },
      { $set: { vendedor: "Bety" } }
    );

    const ranking = await Sale.aggregate([
      { $match: { archivado: false } }, // Solo ranking del mes activo
      {
        $project: {
          vendedor: 1,
          totalPago: 1,
          costoEnvio: 1,
          montoTotal: 1,
          cantidad: 1,
          tacosVendidos: {
            $sum: {
              $map: {
                input: { $ifNull: ["$productos", []] },
                as: "prod",
                in: {
                  $cond: [
                    { $regexMatch: { input: { $ifNull: ["$$prod.type", "$$prod.nombre"] }, regex: /taco/i } },
                    { $convert: { input: "$$prod.cantidad", to: "int", onError: 0, onNull: 0 } },
                    0
                  ]
                }
              }
            }
          }
        }
      },
      {
        $group: {
          _id: "$vendedor",
          totalVentas: { $sum: 1 },                  
          totalPrendas: { $sum: "$cantidad" },       
          dineroGenerado: { $sum: "$totalPago" },    
          enviosGenerados: { $sum: "$costoEnvio" },  
          montoTotal: { $sum: "$montoTotal" },
          totalTacos: { $sum: "$tacosVendidos" },
        }
      },
      {
        $addFields: {
          totalChemas: { $subtract: ["$totalPrendas", "$totalTacos"] }
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

// 🔄 RUTA DE CIERRE DE MES INTELIGENTE (Archivar en lugar de borrar para proteger el Balance)
router.delete('/reset/all', requireRole('edit'), async (req, res) => {
  try {
    // En lugar de hacer deleteMany, marcamos las ventas como archivadas para que el Balance anual las conserve
    await Sale.updateMany({ archivado: false }, { $set: { archivado: true } });
    
    await History.create({
      user: actorName(req, 'Admin'),
      action: 'archivó ventas del mes',
      item: 'Cierre de mes de ventas',
      date: new Date(),
      details: 'Las ventas del mes activo pasaron al historial financiero general.'
    });

    res.json({ success: true, message: "Cierre de mes realizado con éxito. El panel diario está en cero pero el balance guarda la memoria." });
  } catch (error) {
    console.error("Error al resetear ventas:", error);
    res.status(500).json({ error: "Error al realizar el cierre de mes." });
  }
});

// 🗑️ DELETE: Eliminar venta por ID individual, devolver stock y registrar en historial
router.delete('/:id', requireRole('edit'), async (req, res) => {
  try {
    // Borrado atómico: solo UNA petición puede obtener la venta, así el stock nunca se devuelve dos veces
    const saleToDelete = await Sale.findByIdAndDelete(req.params.id).lean().catch(() => null);
    if (!saleToDelete) {
      return res.status(404).json({ error: "Venta no encontrada" });
    }

    const ajustes = await adjustMany(
      (saleToDelete.productos || [])
        .filter((p) => p?.tipoVenta === 'stock' && p.productoId)
        .map((p) => ({ productId: p.productoId, talla: p.talla, delta: Number(p.cantidad) || 1, nombre: p.nombre }))
    );
    const devueltos = ajustes.filter((a) => a.ok);
    const fallidos = ajustes.filter((a) => !a.ok);

    await History.create({
      user: actorName(req, 'Admin'),
      action: 'eliminó venta',
      item: `Cliente: ${saleToDelete.nombre}`,
      date: new Date(),
      details: `Venta eliminada por monto de ₡${saleToDelete.montoTotal?.toLocaleString()} | Stock devuelto: ${devueltos.length ? devueltos.map((d) => `${d.nombre} (${d.key}) +${d.delta}`).join(', ') : 'ninguno'}${fallidos.length ? ` | ⚠️ No devuelto: ${fallidos.map((f) => `${f.nombre} (${f.talla})`).join(', ')}` : ''}`,
    });

    res.json({
      success: true,
      message: devueltos.length ? "Venta eliminada y stock restaurado en bodega" : "Venta eliminada (no tenía productos de inventario para devolver)",
      stockDevuelto: devueltos.length,
    });
  } catch (error) {
    console.error("Error al eliminar la venta:", error);
    res.status(500).json({ error: "Error al eliminar la venta" });
  }
});

export default router;