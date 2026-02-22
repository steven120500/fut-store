import express from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import sendEmail from '../utils/sendEmail.js';

const router = express.Router();

/**
 * 1️⃣ REGISTRO DE USUARIOS
 */
router.post('/register', async (req, res) => {
  try {
    // Aceptamos los nuevos campos: firstName, lastName, phone
    const { firstName, lastName, email, phone, password, roles } = req.body;

    if (!firstName || !lastName || !email || !phone || !password) {
      return res.status(400).json({ message: 'Todos los campos son obligatorios' });
    }

    // Validación de celular (8 dígitos)
    if (!/^\d{8}$/.test(phone)) {
      return res.status(400).json({ message: 'El celular debe tener exactamente 8 números' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Este correo ya está registrado' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      username: email, // 👈 ¡ESTA ES LA LÍNEA MÁGICA QUE FALTABA!
      firstName,
      lastName,
      email,
      phone,
      password: hashedPassword,
      roles: roles || [],
      isSuperUser: false // Por defecto nadie es SuperUser al registrarse así
    });

    await newUser.save();
    res.status(201).json({ message: 'Usuario registrado correctamente' });

  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({ message: 'Error al registrar usuario' });
  }
});

/**
 * 2️⃣ LOGIN DE USUARIOS (CORREGIDO)
 * Ahora devuelve el TOKEN para que el frontend pueda usarlo.
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    // 👇 GENERAR TOKEN (ESTO FALTABA)
    const token = jwt.sign(
      { id: user._id, isSuperUser: user.isSuperUser, roles: user.roles },
      process.env.JWT_SECRET || 'secreto_super_seguro', // Usa tu variable de entorno
      { expiresIn: '30d' }
    );

    res.json({
      token, // 👈 Enviamos el token al frontend
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      roles: user.roles,
      isSuperUser: user.isSuperUser,
    });

  } catch (error) {
    console.error("Error en login:", error);
    res.status(500).json({ message: 'Error al iniciar sesión' });
  }
});

/**
 * 3️⃣ SOLICITAR RECUPERACIÓN
 */
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'No existe un usuario con ese correo' });
    }

    const resetToken = crypto.randomBytes(20).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpires = Date.now() + 3600000; 

    await user.save();

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const resetUrl = `${frontendUrl}/reset-password/${resetToken}`;

    const message = `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
        <h2 style="color: #333; text-align: center;">FutStore - Recuperación</h2>
        <p>Hola, <strong>${user.firstName || 'Usuario'}</strong>.</p>
        <p>Has solicitado restablecer tu contraseña. Haz clic abajo:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #000; color: #fff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold;">RESTABLECER CONTRASEÑA</a>
        </div>
      </div>
    `;

    await sendEmail({
      email: user.email,
      subject: 'Recuperar Contraseña - FutStore',
      message
    });
    
    res.json({ message: 'Correo enviado con éxito' });

  } catch (error) {
    console.error("Error en forgot-password:", error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
});

/**
 * 4️⃣ RESTABLECER CONTRASEÑA
 */
router.post('/reset-password/:token', async (req, res) => {
  try {
    const resetPasswordToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'El enlace es inválido o ha expirado' });
    }

    user.password = await bcrypt.hash(req.body.password, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();
    res.json({ message: 'Contraseña actualizada correctamente' });

  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar contraseña' });
  }
});

/**
 * 🛠️ RUTAS DE ADMINISTRACIÓN (GET Y DELETE)
 */

// Obtener todos los usuarios
router.get('/users', async (req, res) => {
  try {
    // Opcional: Podrías verificar el token aquí también si quisieras seguridad extra
    const users = await User.find({}, '-password').sort({ createdAt: -1 }); // Ordenar por más recientes
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener usuarios' });
  }
});

// Eliminar usuario (BLINDADO) 🛡️
router.delete('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Verificar si el usuario existe
    const userToDelete = await User.findById(id);
    if (!userToDelete) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // 2. SEGURIDAD: Impedir borrar al SuperUser desde el backend
    if (userToDelete.isSuperUser) {
      return res.status(403).json({ message: '⛔ No se puede eliminar al SuperAdmin' });
    }

    // 3. Eliminar
    await User.findByIdAndDelete(id);
    res.json({ message: 'Usuario eliminado correctamente' });

  } catch (error) {
    console.error("Error al eliminar:", error);
    res.status(500).json({ message: 'Error interno al eliminar usuario' });
  }
});

export default router;