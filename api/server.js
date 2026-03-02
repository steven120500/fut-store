
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import compression from 'compression';
import helmet from 'helmet'; 
import morgan from 'morgan'; 
import connectDB from './config/db.js';

// --- RUTAS ---
import productRoutes from './routes/productRoutes.js';
import authRoutes from './routes/authRoutes.js';
import pdfRoutes from './routes/pdfRoutes.js';
import historyRoutes from './routes/historyRoutes.js';
import tiloPayRoutes from './routes/tiloPayRoutes.js';
import orderRoutes from './routes/orderRoutes.js'; // 👈 1. NUEVA IMPORTACIÓN

dotenv.config();

// Validación de variables (Solo avisa, no bloquea)
const requiredEnvs = ['MONGO_URI', 'RESEND_API_KEY', 'FRONTEND_URL', 'TILOPAY_USER', 'TILOPAY_PASSWORD', 'TILOPAY_API_KEY'];
requiredEnvs.forEach((env) => {
  if (!process.env[env]) console.warn(`⚠️ FALTA VARIABLE: ${env}`);
});

const app = express();

/* -------- CONFIGURACIÓN -------- */
app.use(helmet());                          
app.disable('x-powered-by');                
app.set('json spaces', 0);                  
app.set('trust proxy', 1);                  
app.use(compression());                     
app.use(morgan('dev'));                     

// CORS: Lista blanca

const allowedOrigins = [
  'https://fut-store-frontend.onrender.com',
  'http://localhost:5173',
  "https://futstorecr.com",                  // 👈 ¡TU NUEVO DOMINIO!
  "https://www.futstorecr.com"
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    console.error(`Bloqueado CORS: ${origin}`);
    return callback(new Error('Bloqueado por seguridad (CORS)'));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

/* -------- DB & RUTAS -------- */
try { await connectDB(); } catch (e) { console.error("Error DB:", e.message); }

app.use('/api/auth', authRoutes);
app.use('/api', pdfRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/products', productRoutes);
app.use('/api/tilopay', tiloPayRoutes);
app.use('/api/orders', orderRoutes); // 👈 2. NUEVA RUTA CONECTADA

app.get('/', (req, res) => res.send('BACKEND ONLINE 🚀'));
app.use((req, res) => res.status(404).json({ error: 'Ruta no encontrada' }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server en puerto ${PORT}`));




