const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();
const Producto = require("./models/Producto"); 
const Venta = require("./models/Venta");

// Configuración inicial mejorada
const app = express();
const PORT = process.env.PORT || 3000;

// 1. Middlewares mejorados
app.use(cors({
  origin: process.env.CORS_ORIGIN || "*",
  methods: ["GET", "POST", "PUT", "DELETE"]
}));
app.use(express.json({ limit: "10kb" }));

// 2. Conexión a MongoDB con configuración robusta
console.log('🔄 Intentando conectar a MongoDB...');
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000
})
.then(() => console.log('✅ Conectado a MongoDB Atlas'))
.catch(err => {
  console.error('❌ Error de conexión a MongoDB:', err);
  process.exit(1); // Salir si no puede conectar
});

// Eventos de conexión para mejor monitoreo
mongoose.connection.on('connected', () => {
  console.log('✅ Conexión establecida con MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ Error en conexión MongoDB:', err);
});

// 3. Rutas optimizadas

// Ruta de verificación de estado
app.get('/health', (req, res) => {
  res.json({
    status: 'running',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date()
  });
});

// Ruta raíz informativa
app.get('/', (req, res) => {
  res.json({
    message: '¡API de FutStore funcionando!',
    version: '1.0.0',
    endpoints: {
      productos: {
        get: '/api/products',
        post: '/api/products',
        put: '/api/products/:id',
        delete: '/api/products/:id'
      },
      ventas: {
        post: '/api/sales',
        getToday: '/api/sales/today',
        clear: '/api/sales/clear',
        report: '/api/sales/report'
      }
    }
  });
});

// Controlador de Productos
const productoController = {
  getAll: async (req, res) => {
    const productos = await Producto.find().sort({ createdAt: -1 });
    res.json(productos);
  },
  create: async (req, res) => {
    const producto = await Producto.create(req.body);
    res.status(201).json(producto);
  },
  update: async (req, res) => {
    const producto = await Producto.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { new: true, runValidators: true }
    );
    if (!producto) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json(producto);
  },
  delete: async (req, res) => {
    const producto = await Producto.findByIdAndDelete(req.params.id);
    if (!producto) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json({ message: 'Producto eliminado' });
  }
};

// Rutas de Productos
app.get('/api/products', productoController.getAll);
app.post('/api/products', productoController.create);
app.put('/api/products/:id', productoController.update);
app.delete('/api/products/:id', productoController.delete);

// Controlador de Ventas
const ventaController = {
  create: async (req, res) => {
    const producto = await Producto.findById(req.body.productoId);
    if (!producto) throw new Error('Producto no encontrado');
    
    if (producto.cantidad < (req.body.cantidad || 1)) {
      throw new Error('Stock insuficiente');
    }

    const venta = await Venta.create({
      productoId: producto._id,
      equipo: producto.equipo,
      jugador: producto.jugador,
      precio: producto.precio,
      talla: producto.talla,
      color: producto.color,
      tipo: producto.tipo,
      cantidad: req.body.cantidad || 1
    });

    producto.cantidad -= venta.cantidad;
    await producto.save();

    res.status(201).json({
      ...venta.toObject(),
      total: venta.precio * venta.cantidad,
      stockActualizado: producto.cantidad
    });
  },
  getToday: async (req, res) => {
    const hoy = new Date().setHours(0, 0, 0, 0);
    const ventas = await Venta.find({ fecha: { $gte: hoy } }).sort({ fecha: -1 });
    const total = ventas.reduce((sum, v) => sum + (v.precio * v.cantidad), 0);
    res.json({ ventas, total, count: ventas.length });
  },
  clearToday: async (req, res) => {
    const hoy = new Date().setHours(0, 0, 0, 0);
    const result = await Venta.deleteMany({ fecha: { $gte: hoy } });
    res.json({ 
      success: true,
      deletedCount: result.deletedCount
    });
  },
  getReport: async (req, res) => {
    const hoy = new Date().setHours(0, 0, 0, 0);
    const ventas = await Venta.find({ fecha: { $gte: hoy } }).sort({ fecha: -1 }).lean();
    res.json({
      fecha: new Date().toLocaleDateString(),
      ventas,
      total: ventas.reduce((sum, v) => sum + (v.precio * v.cantidad), 0),
      count: ventas.length
    });
  }
};

// Rutas de Ventas
app.post('/api/sales', ventaController.create);
app.get('/api/sales/today', ventaController.getToday);
app.delete('/api/sales/clear', ventaController.clearToday);
app.get('/api/sales/report', ventaController.getReport);

// 4. Manejo centralizado de errores
app.use((err, req, res, next) => {
  console.error('🔥 Error:', err.stack);
  
  const statusCode = err.message.includes('no encontrado') ? 404 : 
                    err.message.includes('Stock') ? 400 : 500;
  
  res.status(statusCode).json({
    error: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// 5. Inicio del servidor con manejo de cierre
const server = app.listen(PORT, () => {
  console.log(`🚀 Servidor escuchando en puerto ${PORT}`);
  console.log(`🔗 http://localhost:${PORT}`);
});

// Manejo de cierre elegante
process.on('SIGTERM', () => {
  console.log('🛑 Apagando servidor...');
  server.close(() => {
    mongoose.connection.close(false, () => {
      console.log('✅ Servidor y conexión a MongoDB cerrados');
      process.exit(0);
    });
  });
});