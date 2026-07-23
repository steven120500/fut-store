import express from 'express';
import Sale from '../models/Sale.js';
import Product from '../models/Product.js';
import History from '../models/History.js'; // 👈 IMPORTANTE: Importamos el modelo de historial

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

// 📥 POST: Guardar venta con DESCUENTO DE INVENTARIO Y REGISTRO EN HISTORIAL
router.post('/', async (req, res) => {
  try {
    const rawVendedor = req.body.vendedor || req.headers['x-user'] || 'Steven Corrales';
    const vendedorEstandarizado = normalizarVendedor(rawVendedor);

    const productosVendidos = req.body.productos || [];

    // 🛡️ MAGIA DE INVENTARIO: Descontar stock en la base de datos si la chema tiene ID del catálogo
    if (productosVendidos.length > 0) {
      for (const prod of productosVendidos) {
        if (prod.tipoVenta === 'stock' && prod.productoId) {
          try {
            const dbProduct = await Product.findById(prod.productoId);
            if (dbProduct && dbProduct.stock) {
              const talla = String(prod.talla);
              const cantidadVendida = Number(prod.cantidad) || 1;
              
              const stockActual = Number(dbProduct.stock[talla]) || 0;
              const nuevoStock = Math.max(0, stockActual - cantidadVendida);
              
              dbProduct.stock[talla] = nuevoStock;
              dbProduct.markModified('stock');
              await dbProduct.save();
            }
          } catch (err) {
            console.error(`Advertencia: No se pudo descontar stock del producto ${prod.productoId}:`, err.message);
          }
        }
      }
    }

    let cantidadTotal = 0;
    if (productosVendidos.length > 0) {
      cantidadTotal = productosVendidos.reduce((acc, p) => acc + (Number(p.cantidad) || 0), 0);
    } else {
      cantidadTotal = Number(req.body.cantidad) || 1;
    }

    const resumenChemas = req.body.productoNombre || (productosVendidos.map(p => `${p.cantidad}x ${p.nombre} (${p.talla})`).join(' + ') || 'Camiseta');

    const newSale = await Sale.create({
      cedula: req.body.cedula,
      nombre: req.body.nombre,
      numero: req.body.numero,
      totalPago: Number(req.body.totalPago) || 0,
      costoEnvio: Number(req.body.costoEnvio) || 0,
      montoTotal: Number(req.body.montoTotal) || 0,
      
      tallaVendida: req.body.tallaVendida || (productosVendidos[0]?.talla || 'N/A'),
      cantidad: cantidadTotal,
      productoNombre: resumenChemas,
      productos: productosVendidos,

      vendedor: vendedorEstandarizado,
      fecha: req.body.fecha ? new Date(req.body.fecha) : new Date(),
      archivado: false
    });

    // 🏆 REGISTRAR EN EL HISTORIAL DEL SISTEMA
    await History.create({
      user: vendedorEstandarizado,
      action: 'registró venta rápida',
      item: `Cliente: ${req.body.nombre} (${cantidadTotal} unds)`,
      date: new Date(),
      details: `Detalle: ${resumenChemas} | Total: ₡${(Number(req.body.montoTotal) || 0).toLocaleString()}`
    });

    res.status(201).json({ success: true, sale: newSale });
  } catch (error) {
    console.error("Error al guardar venta:", error);
    res.status(500).json({ error: "Error interno al registrar la venta" });
  }
});

// 📤 GET: Obtener todas las ventas
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

// 📊 GET /ranking: Obtener métricas de rendimiento por empleado
router.get('/ranking', async (req, res) => {
  try {
    const ranking = await Sale.aggregate([
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

// 🔄 DELETE: Cierre de mes (Borrado total)
router.delete('/reset/all', async (req, res) => {
  try {
    await Sale.deleteMany({});
    
    await History.create({
      user: req.headers['x-user'] || 'Admin',
      action: 'reseteó todas las ventas',
      item: 'Cierre de mes de ventas',
      date: new Date(),
      details: 'Se vaciaron todas las ventas del sistema'
    });

    res.json({ success: true, message: "Todas las ventas han sido borradas para el nuevo mes." });
  } catch (error) {
    console.error("Error al resetear ventas:", error);
    res.status(500).json({ error: "Error al vaciar las ventas del sistema." });
  }
});

// 🗑️ DELETE: Eliminar venta por ID, devolver stock y registrar en historial
router.delete('/:id', async (req, res) => {
  try {
    const saleToDelete = await Sale.findById(req.params.id);
    if (!saleToDelete) {
      return res.status(404).json({ error: "Venta no encontrada" });
    }

    // 🔄 REVERTIR STOCK
    if (saleToDelete.productos && saleToDelete.productos.length > 0) {
      for (const prod of saleToDelete.productos) {
        if (prod.tipoVenta === 'stock' && prod.productoId) {
          try {
            const dbProduct = await Product.findById(prod.productoId);
            if (dbProduct && dbProduct.stock) {
              const talla = String(prod.talla);
              const cantidadDevuelta = Number(prod.cantidad) || 1;
              
              const stockActual = Number(dbProduct.stock[talla]) || 0;
              dbProduct.stock[talla] = stockActual + cantidadDevuelta;
              
              dbProduct.markModified('stock');
              await dbProduct.save();
            }
          } catch (err) {
            console.error(`Advertencia: No se pudo restaurar stock del producto ${prod.productoId}:`, err.message);
          }
        }
      }
    }

    await Sale.findByIdAndDelete(req.params.id);

    // 🏆 REGISTRAR LA ELIMINACIÓN EN EL HISTORIAL
    await History.create({
      user: req.headers['x-user'] || 'Admin',
      action: 'eliminó venta',
      item: `Cliente: ${saleToDelete.nombre}`,
      date: new Date(),
      details: `Venta eliminada por monto de ₡${saleToDelete.montoTotal?.toLocaleString()}`
    });

    res.json({ success: true, message: "Venta eliminada y stock restaurado en bodega" });
  } catch (error) {
    console.error("Error al eliminar la venta:", error);
    res.status(500).json({ error: "Error al eliminar la venta" });
  }
});

export default router;