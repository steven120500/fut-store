// Unifica los nombres de vendedor ya guardados (Alonso → Bety, Bulo/Justin → Justin Lobo, Steven → Steven Corrales...)
// en Ventas, Apartados e Ingresos.
//
//   node scripts/normalizar-vendedores.js            → solo muestra qué cambiaría
//   node scripts/normalizar-vendedores.js --aplicar  → aplica los cambios
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Sale from '../models/Sale.js';
import Apartado from '../models/Apartado.js';
import Ingreso from '../models/Ingreso.js';
import { vendedorOficial } from '../utils/vendedores.js';

dotenv.config();
const aplicar = process.argv.includes('--aplicar');

await mongoose.connect(process.env.MONGO_URI);

for (const [etiqueta, Modelo] of [['Ventas', Sale], ['Apartados', Apartado], ['Ingresos', Ingreso]]) {
  const nombres = await Modelo.distinct('vendedor');
  for (const actual of nombres) {
    const oficial = vendedorOficial(actual); // solo toca nombres que son de un vendedor conocido
    if (!oficial || oficial === actual) continue;
    const n = await Modelo.countDocuments({ vendedor: actual });
    console.log(`${etiqueta}: "${actual}" → "${oficial}" (${n})`);
    if (aplicar) await Modelo.updateMany({ vendedor: actual }, { $set: { vendedor: oficial } });
  }
}

console.log(aplicar ? '✅ Cambios aplicados.' : 'ℹ️ Nada se cambió. Corre con --aplicar para guardar.');
await mongoose.disconnect();
