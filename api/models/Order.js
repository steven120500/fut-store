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

  // Pago confirmado servidor a servidor con TiloPay (POST /api/v1/consult)
  pago: {
    idTilopay: String,
    auth: String,
    monto: Number,
    moneda: String,
    tarjeta: String,
    ambiente: String,
    verificadoEn: Date,
  },

  stockDiscounted: { 
    type: Boolean, 
    default: false 
  },
  stockDiscountedAt: Date,
  // Resultado del rebajo por artículo (para confirmarlo en Gestión de Pedidos)
  stockDetalle: [
    {
      _id: false,
      name: String,
      size: String,
      quantity: Number,
      estado: { type: String, enum: ['rebajado', 'sin_stock', 'fallo'] },
      motivo: String,
      antes: Number,
      despues: Number,
    }
  ]

}, { timestamps: true });

export default mongoose.model('Order', orderSchema);