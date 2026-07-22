import mongoose from 'express'; // o import mongoose from 'mongoose'; asegúrate de usar 'mongoose'
import { Schema, model } from 'mongoose';

const saleSchema = new Schema({
  cedula: { type: String, required: true },
  nombre: { type: String, required: true },
  numero: { type: String, required: true },
  totalPago: { type: Number, required: true, default: 0 },   // Costo chemas
  costoEnvio: { type: Number, required: true, default: 0 },  // Costo envío
  montoTotal: { type: Number, required: true, default: 0 },  // Suma total
  tallaVendida: { type: String, required: true },
  cantidad: { type: Number, required: true, default: 1 },
  productoId: { type: String },
  productoNombre: { type: String, required: true },
  vendedor: { type: String, required: true, default: 'Sistema' },
  fecha: { type: Date, default: Date.now }
}, {
  timestamps: true
});

export default model('Sale', saleSchema);