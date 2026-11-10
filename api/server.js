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
import orderRoutes from './routes/orderRoutes.js'; 
import salesRoutes from './routes/sales.js'; 
import expensesRoutes from './routes/expenses.js';
import apartadosRoutes from './routes/apartados.js'; // 👈 1. IMPORTACIÓN DE LA RUTA DE APARTADOS
import { attachAuth, getJwtSecret } from './middleware/auth.js';

dotenv.config();

// Validación de variables (Solo avisa, no bloquea)
const requiredEnvs = ['MONGO_URI', 'RESEND_API_KEY', 'FRONTEND_URL', 'TILOPAY_USER', 'TILOPAY_PASSWORD', 'TILOPAY_API_KEY'];
requiredEnvs.forEach((env) => {
  if (!process.env[env]) console.warn(`⚠️ FALTA VARIABLE: ${env}`);
});
if (!getJwtSecret()) {
  console.error('🚨 FALTA JWT_SECRET (mínimo 32 caracteres). Nadie podrá iniciar sesión hasta configurarlo.');
}

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
  "https://futstorecr.com",                  
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

// Límite de 1 MB en general; solo productos y apartados (que llevan fotos en base64) aceptan más
app.use(['/api/products', '/api/apartados'], express.json({ limit: '12mb' }));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(attachAuth); // lee el token (si viene) y carga el usuario real desde la BD

/* -------- DB & RUTAS -------- */
try { await connectDB(); } catch (e) { console.error("Error DB:", e.message); }

app.use('/api/auth', authRoutes);
app.use('/api', pdfRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/products', productRoutes);
app.use('/api/tilopay', tiloPayRoutes);
app.use('/api/orders', orderRoutes); 
app.use('/api/sales', salesRoutes); 
app.use('/api/expenses', expensesRoutes);
app.use('/api/apartados', apartadosRoutes); // 👈 2. RUTA DE APARTADOS CONECTADA

app.get('/', (req, res) => res.send('BACKEND ONLINE 🚀'));
app.use((req, res) => res.status(404).json({ error: 'Ruta no encontrada' }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server en puerto ${PORT}`));