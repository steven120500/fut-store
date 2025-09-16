// scripts/export.js
import fs from 'fs/promises';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

// importa tus modelos reales
import Producto from './backend/models/Producto.js'; // ajusta la ruta/nombre
import Venta from './backend/models/Venta.js';

async function main() {
  const uri = process.env.MONGODB_URI; // pon tu cadena en .env
  if (!uri) throw new Error('Falta MONGODB_URI en .env');

  await mongoose.connect(uri, { dbName: process.env.MONGODB_DB || undefined });

  // Trae todo (si hay muchas docs, puedes hacer streams/paginación)
  const [productos, ventas] = await Promise.all([
    Producto.find({}).lean(),
    Venta.find({}).lean(),
  ]);

  await fs.writeFile('export_productos.json', JSON.stringify(productos, null, 2), 'utf8');
  await fs.writeFile('export_ventas.json', JSON.stringify(ventas, null, 2), 'utf8');

  console.log(`OK ✅  productos: ${productos.length}, ventas: ${ventas.length}`);
  await mongoose.disconnect();
}

main().catch(err => {
  console.error('Error exportando:', err);
  process.exit(1);
});