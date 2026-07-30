const mongoose = require('mongoose');

const ingresoSchema = new mongoose.Schema({
  monto: { 
    type: Number, 
    required: true 
  },
  concepto: { 
    type: String, 
    required: true 
  },
  tipo: { 
    type: String, 
    required: true,
    enum: ['Abono Apartado', 'Cancelación Apartado', 'Venta Directa', 'Otro'],
    default: 'Abono Apartado'
  },
  vendedor: { 
    type: String, 
    required: true 
  },
  fecha: { 
    type: Date, 
    default: Date.now 
  }
}, {
  timestamps: true // Esto agregará automáticamente createdAt y updatedAt
});

module.exports = mongoose.model('Ingreso', ingresoSchema);