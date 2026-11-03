import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
  orderId: { type: String, required: true, unique: true },
  
  customer: {
    cedula: { type: String, default: "" }, // 👈 ESTA ES LA LÍNEA AGREGADA
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
      version: String,  
      quantity: { type: Number, default: 1 },
      price: Number,
      image: String 
    }
  ],

  shipping: {
    method: { type: String, default: 'Estándar' }, 
    cost: { type: Number, default: 0 }             
  },

  total: Number,
  status: { 
    type: String, 
    enum: ['pending', 'paid', 'sent', 'cancelled'], 
    default: 'pending'
  },
  
  tiloPayToken: String,

  stockDiscounted: { 
    type: Boolean, 
    default: false 
  }

}, { timestamps: true });

export default mongoose.model('Order', orderSchema);