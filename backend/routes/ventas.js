const express = require('express');
const router = express.Router();
const Venta = require('../models/Venta');
const Producto = require('../models/Producto');

// Registrar nueva venta (versión mejorada)
router.post('/sales', async (req, res) => {
  try {
    // 1. Validar datos de entrada
    const { productoId, cantidad = 1 } = req.body;
    
    if (!productoId) {
      return res.status(400).json({ error: 'El ID del producto es requerido' });
    }

    // 2. Verificar producto y stock
    const producto = await Producto.findById(productoId);
    if (!producto) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    if (producto.cantidad < cantidad) {
      return res.status(400).json({ 
        error: 'Stock insuficiente',
        stockDisponible: producto.cantidad
      });
    }

    // 3. Crear la venta con todos los datos del producto
    const venta = new Venta({
      productoId,
      equipo: producto.equipo,
      jugador: producto.jugador,
      talla: producto.talla,
      color: producto.color,
      temporada: producto.temporada,
      tipo: producto.tipo,
      precio: producto.precio,
      cantidad
    });

    // 4. Actualizar stock del producto
    producto.cantidad -= cantidad;
    await producto.save();
    await venta.save();

    // 5. Responder con datos completos
    res.status(201).json({
      ...venta.toObject(),
      total: venta.precio * venta.cantidad,
      stockActualizado: producto.cantidad,
      message: 'Venta registrada exitosamente'
    });

  } catch (error) {
    console.error('Error en registro de venta:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        error: 'Error de validación',
        details: error.message 
      });
    }

    res.status(500).json({ 
      error: 'Error interno al registrar venta',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Obtener ventas del día actual (versión mejorada)
router.get('/sales/today', async (req, res) => {
  try {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    
    const ventas = await Venta.find({ 
      fecha: { $gte: hoy } 
    })
    .sort({ fecha: -1 }) // Ordenar por fecha descendente (más reciente primero)
    .lean();

    const total = ventas.reduce((sum, v) => sum + (v.precio * v.cantidad), 0);
    const conteo = ventas.length;

    res.json({ 
      success: true,
      ventas,
      total,
      conteo,
      fechaConsulta: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error al obtener ventas:', error);
    res.status(500).json({ 
      error: 'Error al obtener ventas',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Limpiar ventas del día (NUEVO endpoint)
router.delete('/sales/clear', async (req, res) => {
  try {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    
    const resultado = await Venta.deleteMany({ 
      fecha: { $gte: hoy } 
    });

    res.json({
      success: true,
      deletedCount: resultado.deletedCount,
      message: `Se eliminaron ${resultado.deletedCount} ventas del día`
    });

  } catch (error) {
    console.error('Error al limpiar ventas:', error);
    res.status(500).json({ 
      error: 'Error al limpiar ventas',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Generar reporte de ventas (NUEVO endpoint)
router.get('/sales/report', async (req, res) => {
  try {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    
    const ventas = await Venta.find({ fecha: { $gte: hoy } })
      .sort({ fecha: -1 })
      .lean();

    const total = ventas.reduce((sum, v) => sum + (v.precio * v.cantidad), 0);
    const conteo = ventas.length;

    // Datos para el reporte
    const reporte = {
      fechaGeneracion: new Date(),
      fechaInicio: hoy,
      totalVentas: total,
      cantidadVentas: conteo,
      ventas: ventas.map(v => ({
        hora: new Date(v.fecha).toLocaleTimeString(),
        producto: `${v.equipo} - ${v.jugador}`,
        talla: v.talla,
        cantidad: v.cantidad,
        precioUnitario: v.precio,
        total: v.precio * v.cantidad
      })),
      resumenPorProducto: ventas.reduce((acc, v) => {
        const key = `${v.equipo}-${v.jugador}-${v.talla}`;
        acc[key] = (acc[key] || 0) + v.cantidad;
        return acc;
      }, {})
    };

    res.json({
      success: true,
      reporte
    });

  } catch (error) {
    console.error('Error al generar reporte:', error);
    res.status(500).json({ 
      error: 'Error al generar reporte',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Verificar nuevo día (versión mejorada)
router.get('/sales/check-new-day', async (req, res) => {
  try {
    const ahora = new Date();
    const hoy = new Date(ahora);
    hoy.setHours(0, 0, 0, 0);
    
    const ventasHoy = await Venta.find({ fecha: { $gte: hoy } })
      .sort({ fecha: -1 })
      .lean();

    // Considerar nuevo día si es entre 12:00 AM y 12:05 AM
    const esNuevoDia = ahora.getHours() === 0 && ahora.getMinutes() < 5;

    res.json({
      esNuevoDia,
      ventas: ventasHoy,
      total: ventasHoy.reduce((sum, v) => sum + (v.precio * v.cantidad), 0),
      conteo: ventasHoy.length,
      ultimaVenta: ventasHoy[0] ? ventasHoy[0].fecha : null
    });

  } catch (error) {
    console.error('Error al verificar día nuevo:', error);
    res.status(500).json({ 
      error: 'Error al verificar día nuevo',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;