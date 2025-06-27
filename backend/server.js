const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();
const Producto = require("./models/Producto"); 
const Venta = require("./models/Venta");

const app = express();

// 1. Configuración esencial de middleware
app.use(cors());
app.use(express.json());


// 3. Conexión a MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ Conectado a MongoDB Atlas'))
  .catch(err => console.error('❌ Error de conexión:', err));

// 4. Rutas
app.get('/', (req, res) => {
  res.send('¡API de FutStore funcionando!');
});


// Obtener todos los productos
app.get('/api/products', async (req, res) => {
  try {
    const productos = await Producto.find();
    res.json(productos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Crear nuevo producto
app.post('/api/products', async (req, res) => {
  try {
    const producto = new Producto({
      equipo: req.body.equipo,
      jugador: req.body.jugador,
      precio: req.body.precio,
      color: req.body.color,
      talla: req.body.talla,
      cantidad: req.body.cantidad || 1, // Valor por defecto
      temporada: req.body.temporada,
      tipo: req.body.tipo
    });
    
    await producto.save();
    res.status(201).json(producto);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Eliminar producto (NUEVA RUTA QUE NECESITAS)
app.delete('/api/products/:id', async (req, res) => {
  try {
      const producto = await Producto.findByIdAndDelete(req.params.id);
      if (!producto) return res.status(404).json({ error: 'Producto no encontrado' });
      res.json({ message: 'Producto eliminado' });
  } catch (error) {
      res.status(500).json({ error: error.message });
  }
});

// Actualizar producto
app.put('/api/products/:id', async (req, res) => {
  
  try {
    const productoActualizado = await Producto.findByIdAndUpdate(
      req.params.id, // ID del producto a actualizar
      {
        $set: { // Solo actualiza los campos que vienen en el body
          equipo: req.body.equipo,
          jugador: req.body.jugador,
          precio: req.body.precio,
          color: req.body.color,
          talla: req.body.talla,
          cantidad: req.body.cantidad,
          temporada: req.body.temporada,
          tipo: req.body.tipo
        }
      },
      { new: true } // Devuelve el documento actualizado
    );

    if (!productoActualizado) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    res.json(productoActualizado);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

//Registrar venta
app.post('/api/sales', async (req, res) => {
  try {
    const venta = new Venta({
      productoId: req.body.productoId,
      equipo: req.body.equipo,
      jugador: req.body.jugador,
      precio: req.body.precio,
      talla: req.body.talla,
      cantidad: req.body.cantidad || 1, // Valor por defecto
    });
    
    await venta.save();
    res.status(201).json({
      ...venta.toObject(),
      total: venta.precio * venta.cantidad,
      message: 'Venta registrada exitosamente'
    });
  } catch (error) {
    // 5. Manejo mejorado de errores
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

// Obtener todas las ventas del día
app.get('/api/sales/today', async (req, res) => {
  try {
    const ventas = await Venta.find();
    res.json(ventas);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 5. Manejo de errores
app.use((req, res) => {
  res.status(404).json({ message: "Ruta no encontrada" });
});

// 6. Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor escuchando en http://localhost:${PORT}`);
  console.log(`🔍 Endpoints disponibles:`);
  console.log(`- GET    http://localhost:${PORT}/api/products`);
  console.log(`- POST   http://localhost:${PORT}/api/products`);
  console.log(`- PUT    http://localhost:${PORT}/api/products/:id`);
  console.log(`- DELETE http://localhost:${PORT}/api/products/:id`);
});