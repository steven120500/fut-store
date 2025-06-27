const mongoose = require('mongoose');

const ventaSchema = new mongoose.Schema({  // <-- Cambiado a minúscula
  productoId: { 
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Producto',
    required: true 
  },
  equipo: { type: String, required: true },
  jugador: { type: String, required: true },
  talla: String,
  precio: { type: Number, required: true },
  cantidad: { type: Number, default: 1, min: 1 },
  fecha: { type: Date, default: Date.now }
}, { timestamps: true });

// Índice para búsquedas frecuentes (usando la variable correcta)
ventaSchema.index({ productoId: 1, fecha: 1 });  // <-- Ahora en minúscula

module.exports = mongoose.model('Venta', ventaSchema);  // <-- También aquí