const express = require('express');
const router = express.Router();
const Venta = require('../models/Venta');
const Producto = require('../models/Producto');

// Registrar nueva venta (versión mejorada con validación de jugador)
router.post('/sales', async (req, res) => {
  try {
    const { productoId, cantidad = 1 } = req.body;
    
    if (!productoId) {
      return res.status(400).json({ error: 'El ID del producto es requerido' });
    }

    const producto = await Producto.findById(productoId);
    if (!producto) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    // Validar si el producto necesita jugador
    const tiposRequierenJugador = ['Retro','Player', 'Niños', 'Fan', 'Nacional'];
    if (tiposRequierenJugador.includes(producto.tipo)) {  // Corregido aquí
      if (!producto.jugador || producto.jugador.trim() === '') {
        return res.status(400).json({ 
          error: 'Este tipo de producto requiere un jugador',
          solucion: 'Actualiza el producto con un jugador válido o cambia su tipo',
          producto: {
            _id: producto._id,
            equipo: producto.equipo,
            tipo: producto.tipo,
            jugadorActual: producto.jugador || 'No definido'
          }
        });
      }
    }

    // Crear la venta
    const ventaData = {
      productoId,
      equipo: producto.equipo,
      talla: producto.talla,
      color: producto.color,
      temporada: producto.temporada,
      tipo: producto.tipo,
      precio: producto.precio,
      cantidad
    };

    // Solo agregar jugador si existe en el producto
    if (producto.jugador && producto.jugador.trim() !== '') {
      ventaData.jugador = producto.jugador;
    }

    const venta = new Venta(ventaData);

    // Actualizar stock del producto
    producto.cantidad -= cantidad;
    await producto.save();
    await venta.save();

    res.status(201).json({
      ...venta.toObject(),
      total: venta.precio * venta.cantidad,
      stockActualizado: producto.cantidad,
      message: 'Venta registrada exitosamente'
    });

  } catch (error) {
    console.error('Error en registro de venta:', error);
    
    if (error.name === 'ValidationError') {
      const errors = {};
      Object.keys(error.errors).forEach(key => {
        errors[key] = error.errors[key].message;
      });
      return res.status(400).json({ 
        error: 'Error de validación',
        details: errors 
      });
    }

    res.status(500).json({ 
      error: 'Error interno al registrar venta',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Obtener ventas del día actual
router.get('/sales/today', async (req, res) => {
  try {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    
    const ventas = await Venta.find({ fecha: { $gte: hoy } })
      .sort({ fecha: -1 })
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

// Limpiar ventas del día
router.delete('/sales/clear', async (req, res) => {
  try {
    const resultado = await Venta.limpiarVentasDelDia();
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

// Generar reporte de ventas
router.get('/sales/report', async (req, res) => {
  try {
    const ventas = await Venta.ventasDelDia();
    const total = ventas.reduce((sum, v) => sum + (v.precio * v.cantidad), 0);
    const conteo = ventas.length;

    const reporte = {
      fechaGeneracion: new Date(),
      totalVentas: total,
      cantidadVentas: conteo,
      ventas: ventas.map(v => ({
        hora: new Date(v.fecha).toLocaleTimeString(),
        producto: v.jugador ? `${v.equipo} - ${v.jugador}` : v.equipo,
        talla: v.talla,
        cantidad: v.cantidad,
        precioUnitario: v.precio,
        total: v.precio * v.cantidad
      }))
    };

    res.json({ success: true, reporte });
  } catch (error) {
    console.error('Error al generar reporte:', error);
    res.status(500).json({ 
      error: 'Error al generar reporte',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Verificar nuevo día
router.get('/sales/check-new-day', async (req, res) => {
  try {
    const ahora = new Date();
    const ventasHoy = await Venta.ventasDelDia();
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