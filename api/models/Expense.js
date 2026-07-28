import mongoose from 'mongoose'; // <--- Cambiado de 'express' a 'mongoose'

const expenseSchema = new mongoose.Schema({
  categoria: { 
    type: String, 
    required: true, 
    enum: ['Publicidad', 'Salarios', 'Gasto Extra', 'Empaque/Insumos', 'Otro'] 
  },
  descripcion: { type: String, required: true },
  monto: { type: Number, required: true },
  fecha: { type: Date, default: Date.now },
  registradoPor: { type: String, default: 'Admin' }
}, { timestamps: true });

export default mongoose.model('Expense', expenseSchema);