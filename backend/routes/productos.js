const express = require('express');
const router = express.Router();
const Producto = require('../models/Producto');

// Crear producto
router.post('/products', async (req, res) => {
  try {
    const productData = {
      equipo: req.body.equipo,
      jugador: req.body.jugador,
      temporada: req.body.temporada,
      color: req.body.color,
      talla: req.body.talla,
      cantidad: req.body.cantidad || 1, // Valor por defecto
      precio: req.body.precio,
      tipo: req.body.tipo
    };

    const product = new Producto(productData);
    await product.save();
    res.status(201).send(product);
  } catch (error) {
    res.status(400).send({ error: error.message });
  }
});

// Obtener todos los productos
router.get('/', async (req, res) => {
  const productos = await Producto.find();
  res.json(productos);
});

// Eliminar producto
router.delete('/products/:id', async (req, res) => {
  try {
    const producto = await Producto.findByIdAndDelete(req.params.id);
    
    if (!producto) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }
    
    res.json({ message: 'Producto eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Actualizar producto
router.put('/products/:id', async (req, res) => {
  try {
    const producto = await Producto.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { new: true }
    );
    
    if (!producto) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }
    
    res.json(producto);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;