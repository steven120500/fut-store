const mongoose = require('mongoose');

const ventaSchema = new mongoose.Schema({
  productoId: { 
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Producto',
    required: [true, 'El ID del producto es requerido'] 
  },
  equipo: { 
    type: String, 
    required: [true, 'El equipo es requerido'],
    trim: true
  },
  jugador: { 
    type: String, 
    required: [true, 'El jugador es requerido'],
    trim: true
  },
  temporada: {
    type: String,
    trim: true
  },
  color: {
    type: String,
    trim: true
  },
  talla: { 
    type: String,
    enum: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    uppercase: true,
    trim: true
  },
  tipo: {
    type: String,
    enum: ['Retro', 'Actual', 'Edición Especial', 'Promocional'],
    trim: true
  },
  precio: { 
    type: Number, 
    required: [true, 'El precio es requerido'],
    min: [0.01, 'El precio debe ser mayor a 0']
  },
  cantidad: { 
    type: Number, 
    default: 1, 
    min: [1, 'La cantidad mínima es 1'],
    max: [100, 'La cantidad máxima es 100']
  },
  fecha: { 
    type: Date, 
    default: Date.now,
    index: true 
  },
  totalVenta: {
    type: Number,
    default: function() {
      return this.precio * this.cantidad;
    }
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Índices para optimización
ventaSchema.index({ productoId: 1 });
ventaSchema.index({ fecha: -1 }); // Orden descendente para consultas recientes
ventaSchema.index({ equipo: 1, jugador: 1 }); // Para búsquedas

// Virtual para mostrar información resumida
ventaSchema.virtual('infoResumida').get(function() {
  return `${this.cantidad}x ${this.equipo} - ${this.jugador} (${this.talla})`;
});

// Middleware para calcular automáticamente el total antes de guardar
ventaSchema.pre('save', function(next) {
  this.totalVenta = this.precio * this.cantidad;
  next();
});

// Método estático para obtener ventas del día
ventaSchema.statics.ventasDelDia = async function() {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  
  return this.find({ fecha: { $gte: hoy } })
    .sort({ fecha: -1 })
    .lean();
};

// Método estático para limpiar ventas del día
ventaSchema.statics.limpiarVentasDelDia = async function() {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  
  return this.deleteMany({ fecha: { $gte: hoy } });
};

module.exports = mongoose.model('Venta', ventaSchema);