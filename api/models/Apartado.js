import mongoose from 'mongoose';

const apartadoSchema = new mongoose.Schema({
  vendedor: { type: String, required: true },
  cliente: { type: String, required: true },
  cedula: { type: String },
  telefono: { type: String },
  productos: { type: Array, default: [] }, // Aquí se guarda el array de chemas
  precioTotal: { type: Number, required: true },
  abono: { type: Number, required: true },
  faltante: { type: Number, required: true },
  estado: { 
    type: String, 
    enum: ['PENDIENTE', 'EN_CAMINO', 'PARA_ENTREGAR', 'ENTREGADO'],
    default: 'PENDIENTE' 
  },
  imagen: { type: String }, // URL de la imagen si la subes a Cloudinary/S3, o base64
  fechaCreacion: { type: Date, default: Date.now }
});

export default mongoose.model('Apartado', apartadoSchema);