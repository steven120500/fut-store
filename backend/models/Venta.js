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
    required: function() {
      // Hacer jugador requerido solo si el tipo no es 'Genérico' o similar
      return !['Genérico', 'Equipo', 'Promocional'].includes(this.tipo);
    },
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
    enum: [, 'S', 'M', 'L', 'XL', '2XL', '3XL', '16/4', '20/6','22/8','26/12','28/14',],
    uppercase: true,
    trim: true
  },
  tipo: {
    type: String,
    enum: ['Retro', 'Player', 'Niños', 'Fan', 'Nacional'],
    trim: true,
    default: 'Actual'
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
ventaSchema.index({ fecha: -1 });
ventaSchema.index({ equipo: 1, jugador: 1 });

// Virtual para mostrar información resumida
ventaSchema.virtual('infoResumida').get(function() {
  return this.jugador 
    ? `${this.cantidad}x ${this.equipo} - ${this.jugador} (${this.talla})`
    : `${this.cantidad}x ${this.equipo} (${this.talla})`;
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