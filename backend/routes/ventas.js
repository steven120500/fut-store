const express = require('express');
const router = express.Router();
const Venta = require('../models/Venta');

// Registrar nueva venta
router.post('/sales', async (req, res) => {
  try {
    const venta = new Venta({
      productoId: req.body.productoId,
      equipo: req.body.equipo,
      jugador: req.body.jugador,
      talla: req.body.talla,
      precio: req.body.precio,
      cantidad: req.body.cantidad || 1
    });

    await venta.save();
    
    res.status(201).json({
      ...venta.toObject(),
      total: venta.precio * venta.cantidad
    });
    
  } catch (error) {
    res.status(400).json({ 
      error: 'Error al registrar venta',
      details: error.message 
    });
  }
});

// Obtener ventas del día actual
router.get('/sales/today', async (req, res) => {
  try {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    
    const ventas = await Venta.find({ 
      fecha: { $gte: hoy } 
    });
    
    const total = ventas.reduce((sum, v) => sum + (v.precio * v.cantidad), 0);
    
    res.json({ ventas, total });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Verificar si es un nuevo día y obtener ventas del día actual
router.get('/sales/check-new-day', async (req, res) => {
  try {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0); // Fecha de inicio del día actual
    
    const ventasHoy = await Venta.find({ 
      fecha: { $gte: hoy } 
    });

    const ahora = new Date();
    const esNuevoDia = ahora.getHours() === 0 && ahora.getMinutes() < 5; // Primeros 5 minutos de cada día

    res.json({
      esNuevoDia,
      ventas: ventasHoy,
      total: ventasHoy.reduce((sum, v) => sum + (v.precio * v.cantidad), 0)
    });

  } catch (error) {
    res.status(500).json({ 
      error: 'Error al verificar día nuevo',
      details: error.message 
    });
  }
});

module.exports = router;