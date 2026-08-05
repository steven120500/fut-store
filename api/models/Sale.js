import { Schema, model } from 'mongoose';

const saleSchema = new Schema({
  cedula: { type: String, required: true },
  nombre: { type: String, required: true },
  numero: { type: String, required: true },
  totalPago: { type: Number, required: true, default: 0 },   // Costo total chemas
  costoEnvio: { type: Number, required: true, default: 0 },  // Costo envío único del pedido
  direccionEnvio: { type: String, default: '' },             // 📍 NUEVO: Dirección de envío
  montoTotal: { type: Number, required: true, default: 0 },  // Suma total
  
  // Compatibilidad con ventas anteriores (de un solo producto)
  tallaVendida: { type: String },
  cantidad: { type: Number, default: 1 },
  productoNombre: { type: String },
  
  // 🛍️ ARREGLO FLEXIBLE: Acepta tanto Ventas Rápidas como Apartados
  productos: { type: Array, default: [] },

  vendedor: { type: String, required: true, default: 'Sistema' },
  fecha: { type: Date, default: Date.now },
  archivado: { type: Boolean, default: false }
}, {
  timestamps: true
});

export default model('Sale', saleSchema);