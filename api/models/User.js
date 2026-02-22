import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  // ✅ AQUÍ ESTÁ EL PARCHE: Agregamos username para que Mongoose lo deje pasar
  username: { 
    type: String, 
    unique: true, 
    trim: true 
  },
  firstName: { 
    type: String, 
    required: [true, 'El nombre es obligatorio'], 
    trim: true 
  },
  lastName: { 
    type: String, 
    required: [true, 'El apellido es obligatorio'], 
    trim: true 
  },
  email: { 
    type: String, 
    required: [true, 'El correo es obligatorio'], 
    unique: true, 
    lowercase: true, 
    trim: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Por favor, ingresa un correo válido']
  },
  // ✅ Nuevo campo: Celular (8 dígitos exactos)
  phone: {
    type: String,
    required: [true, 'El número de celular es obligatorio'],
    trim: true,
    validate: {
      validator: function(v) {
        return /^\d{8}$/.test(v); // Valida que sean exactamente 8 números
      },
      message: props => `${props.value} no es un número de celular válido (debe tener 8 dígitos)`
    }
  },
  password: { 
    type: String, 
    required: [true, 'La contraseña es obligatoria'], 
    select: false 
  },
  
  // 🔑 Campos para recuperación de contraseña
  resetPasswordToken: String,
  resetPasswordExpires: Date,

  roles: [{ type: String }], 
  isSuperUser: { type: Boolean, default: false }
}, {
  timestamps: true 
});

export default mongoose.model('User', userSchema);