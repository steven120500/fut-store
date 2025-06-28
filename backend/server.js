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
      cantidad: req.body.cantidad || 1,
      temporada: req.body.temporada,
      tipo: req.body.tipo
    });
    
    await producto.save();
    res.status(201).json(producto);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Eliminar producto
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
      req.params.id,
      {
        $set: {
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
      { new: true }
    );

    if (!productoActualizado) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    res.json(productoActualizado);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ===================== RUTAS MEJORADAS PARA VENTAS =====================

// Registrar venta (mejorada)
app.post('/api/sales', async (req, res) => {
  try {
    // 1. Verificar el producto existe
    const producto = await Producto.findById(req.body.productoId);
    if (!producto) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    // 2. Verificar stock disponible
    if (producto.cantidad < (req.body.cantidad || 1)) {
      return res.status(400).json({ error: 'Stock insuficiente' });
    }

    // 3. Crear la venta
    const venta = new Venta({
      productoId: req.body.productoId,
      equipo: producto.equipo,
      jugador: producto.jugador,
      precio: producto.precio,
      talla: producto.talla,
      color: producto.color,
      tipo: producto.tipo,
      cantidad: req.body.cantidad || 1
    });

    // 4. Actualizar el stock del producto
    producto.cantidad -= venta.cantidad;
    await producto.save();
    await venta.save();

    res.status(201).json({
      ...venta.toObject(),
      total: venta.precio * venta.cantidad,
      message: 'Venta registrada exitosamente'
    });

  } catch (error) {
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

// Obtener ventas del día (mejorada)
app.get('/api/sales/today', async (req, res) => {
  try {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const ventas = await Venta.find({ 
      fecha: { $gte: hoy } 
    }).sort({ fecha: -1 });

    const total = ventas.reduce((sum, v) => sum + (v.precio * v.cantidad), 0);

    res.json({
      ventas,
      total,
      count: ventas.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Limpiar ventas del día (NUEVA)
app.delete('/api/sales/clear', async (req, res) => {
  try {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const result = await Venta.deleteMany({ 
      fecha: { $gte: hoy } 
    });

    res.json({
      success: true,
      deletedCount: result.deletedCount,
      message: `Se eliminaron ${result.deletedCount} ventas`
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Generar reporte PDF (NUEVA)
app.get('/api/sales/report', async (req, res) => {
  try {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const ventas = await Venta.find({ fecha: { $gte: hoy } })
      .sort({ fecha: -1 })
      .lean();

    const reportData = {
      fecha: new Date().toLocaleDateString(),
      ventas,
      total: ventas.reduce((sum, v) => sum + (v.precio * v.cantidad), 0),
      count: ventas.length
    };

    res.json(reportData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 5. Manejo de errores
app.use((req, res) => {
  res.status(404).json({ message: "Ruta no encontrada" });
});

// En tu server.js (backend)
app.delete('/api/sales/clear', async (req, res) => {
  try {
      // Borrar ventas del día en MongoDB
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      
      const result = await Venta.deleteMany({ 
          fecha: { $gte: hoy } 
      });
      
      res.json({
          success: true,
          deletedCount: result.deletedCount
      });
  } catch (error) {
      res.status(500).json({ 
          success: false,
          error: error.message 
      });
  }
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
  console.log(`\n📊 Endpoints de Ventas:`);
  console.log(`- POST   http://localhost:${PORT}/api/sales`);
  console.log(`- GET    http://localhost:${PORT}/api/sales/today`);
  console.log(`- DELETE http://localhost:${PORT}/api/sales/clear`);
  console.log(`- GET    http://localhost:${PORT}/api/sales/report`);
})