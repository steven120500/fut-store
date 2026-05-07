import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
  orderId: { type: String, required: true, unique: true },
  
  customer: {
    name: String,
    email: String,
    phone: String,
    address: String
  },

  items: [
    {
      product_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
      name: String,
      size: String,
      color: String,
      version: String,  // ✅ Perfecto, coincide con lo que enviamos
      quantity: { type: Number, default: 1 },
      price: Number,
      image: String 
    }
  ],

  shipping: {
    method: { type: String, default: 'Estándar' }, // Ej: "Correos de Costa Rica"
    cost: { type: Number, default: 0 }             // Ej: 3500
  },

  total: Number,
  status: { 
    type: String, 
    enum: ['pending', 'paid', 'sent', 'cancelled'], 
    default: 'pending'
  },
  
  tiloPayToken: String,

  // 👇 ESTO ES LO ÚNICO NUEVO QUE SE AGREGÓ 👇
  stockDiscounted: { 
    type: Boolean, 
    default: false 
  }

}, { timestamps: true });

export default mongoose.model('Order', orderSchema);