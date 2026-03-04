// models/History.js
import mongoose from 'mongoose';

const HistorySchema = new mongoose.Schema({
  user: { type: String, required: true },
  action: { type: String, required: true },
  item: { type: String, required: true }, // 👈 Este es el nombre del producto
  productId: { type: String }, // 👈 Opcional: para rastrear qué ID se tocó
  date: { type: Date, default: Date.now, index: true },
  details: mongoose.Schema.Types.Mixed, 
}, { timestamps: true }); // timestamps añade automáticamente createdAt y updatedAt

HistorySchema.index({ user: 1, date: -1 });

export default mongoose.model('History', HistorySchema);