// utils/stock.js — ajustes de inventario ATÓMICOS
//
// Antes cada ruta hacía: leer stock → restar en JS → guardar. Si dos ventas de la misma
// talla llegaban casi al mismo tiempo, una pisaba a la otra y el stock quedaba mal.
// Ahora la suma/resta la hace MongoDB en una sola operación ($setField), que además
// soporta tallas con puntos como "7.5 US (40.5)" (un $inc normal las rompería).
import mongoose from 'mongoose';
import Product from '../models/Product.js';

const normalize = (s) => String(s ?? '').replace(/,/g, '.').replace(/\s+/g, ' ').trim().toLowerCase();

/** Encuentra la clave REAL de la talla dentro del stock del producto (tolera coma/punto y mayúsculas). */
export function resolveStockKey(stock, talla) {
  if (!stock || typeof stock !== 'object' || talla === undefined || talla === null) return null;
  const keys = Object.keys(stock); // solo claves propias: "constructor", "__proto__", etc. nunca coinciden
  const exact = String(talla);
  if (keys.includes(exact)) return exact;
  const target = normalize(talla);
  return keys.find((k) => normalize(k) === target) || null;
}

/**
 * Suma (delta > 0) o resta (delta < 0) unidades de una talla, sin bajar nunca de 0.
 * Solo toca tallas que ya existen en el producto.
 * @returns {Promise<{ok: boolean, reason?: string, key?: string, name?: string}>}
 */
export async function adjustStock(productId, talla, delta) {
  const qty = Math.trunc(Number(delta));
  if (!Number.isFinite(qty) || qty === 0) return { ok: false, reason: 'cantidad_invalida' };
  if (!productId || !mongoose.isValidObjectId(String(productId))) return { ok: false, reason: 'id_invalido' };

  const _id = new mongoose.Types.ObjectId(String(productId));
  const product = await Product.findById(_id).select('stock name').lean();
  if (!product) return { ok: false, reason: 'producto_no_encontrado' };

  const key = resolveStockKey(product.stock, talla);
  if (!key) return { ok: false, reason: 'talla_no_encontrada', name: product.name };

  const field = { $literal: key };
  const current = { $convert: { input: { $getField: { field, input: '$stock' } }, to: 'int', onError: 0, onNull: 0 } };

  await Product.collection.updateOne({ _id }, [
    {
      $set: {
        stock: {
          $setField: {
            field,
            input: '$stock',
            value: { $max: [0, { $add: [current, qty] }] },
          },
        },
      },
    },
  ]);

  return { ok: true, key, name: product.name };
}

/** Aplica varios ajustes y devuelve el detalle (para historial / logs). */
export async function adjustMany(items) {
  const results = [];
  for (const it of items) {
    try {
      results.push({ ...it, ...(await adjustStock(it.productId, it.talla, it.delta)) });
    } catch (err) {
      results.push({ ...it, ok: false, reason: err.message });
    }
  }
  return results;
}
