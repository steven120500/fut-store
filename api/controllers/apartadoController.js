import mongoose from 'mongoose';
import Apartado from '../models/Apartado.js';
import Ingreso from '../models/Ingreso.js';
import Venta from '../models/Sale.js';
import { adjustMany } from '../utils/stock.js';
import { asString } from '../utils/security.js';

const ESTADOS_EDITABLES = ['PENDIENTE', 'EN_CAMINO', 'PARA_ENTREGAR']; // ENTREGADO solo vía /entregar

// Productos del apartado que salen del inventario
const itemsDeStock = (productos = []) =>
  productos
    .filter((p) => p?.tipoPedido === 'stock' && p.productoObj && (p.productoObj._id || p.productoObj.id))
    .map((p) => ({
      productId: p.productoObj._id || p.productoObj.id,
      talla: p.talla,
      cantidad: Math.max(1, Math.trunc(Number(p.cantidad) || 1)),
      nombre: p.productoObj.name || p.busqueda || 'Producto',
    }));

export const crearApartado = async (req, res) => {
  try {
    const { vendedor, cliente, cedula, telefono, imagen, imagen2, direccionEnvio } = req.body;
    const productos = Array.isArray(req.body.productos) ? req.body.productos : [];

    // --- Validaciones ---
    if (!asString(vendedor) || !asString(cliente)) return res.status(400).json({ error: 'Vendedor y cliente son obligatorios' });
    if (productos.length === 0) return res.status(400).json({ error: 'Agrega al menos un producto' });
    for (const p of productos) {
      const c = Number(p?.cantidad ?? 1);
      if (!Number.isInteger(c) || c < 1 || c > 500) return res.status(400).json({ error: 'Cantidad inválida en uno de los productos' });
    }
    const precioTotal = Number(req.body.precioTotal);
    const abono = Number(req.body.abono);
    const costoEnvio = Math.max(0, Number(req.body.costoEnvio) || 0);
    // 0 es válido: el tablero de Re-Stock crea encargos internos sin precio
    if (!Number.isFinite(precioTotal) || precioTotal < 0) return res.status(400).json({ error: 'Precio total inválido' });
    if (!Number.isFinite(abono) || abono < 0) return res.status(400).json({ error: 'Abono inválido' });
    if (abono > precioTotal) return res.status(400).json({ error: 'El abono no puede ser mayor que el total' });
    const faltante = precioTotal - abono; // se calcula en el servidor, no se confía en el navegador

    // 1. Guardar el apartado (si algo está mal, no se toca el inventario)
    const apartadoGuardado = await new Apartado({
      vendedor, cliente, cedula, telefono, productos,
      precioTotal, abono, faltante, imagen, imagen2,
      costoEnvio, direccionEnvio,
    }).save();

    // 2. Descontar inventario (atómico)
    const ajustes = await adjustMany(itemsDeStock(productos).map((i) => ({ productId: i.productId, talla: i.talla, delta: -i.cantidad, nombre: i.nombre })));
    const fallidos = ajustes.filter((a) => !a.ok);
    if (fallidos.length) console.warn('⚠️ Apartado creado sin descontar stock en:', fallidos.map((f) => `${f.nombre} (${f.talla}): ${f.reason}`).join(' | '));

    // 3. Registrar el abono, ligado al apartado
    if (abono > 0) {
      await Ingreso.create({
        monto: abono,
        concepto: `Abono de ₡${abono} - Apartado Cliente: ${cliente}`,
        tipo: 'Abono Apartado',
        fecha: new Date(),
        vendedor,
        apartadoId: apartadoGuardado._id,
      });
    }

    res.status(201).json({ mensaje: 'Creado con éxito', apartado: apartadoGuardado, stockWarnings: fallidos.map((f) => ({ nombre: f.nombre, talla: f.talla, motivo: f.reason })) });
  } catch (error) {
    console.error(error);
    if (error?.name === 'ValidationError') return res.status(400).json({ error: 'Faltan datos obligatorios del apartado' });
    res.status(500).json({ error: 'Error al crear el apartado' });
  }
};

export const entregarApartado = async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) return res.status(404).json({ error: 'Apartado no encontrado' });

  // Cambio de estado atómico: si dos personas tocan "entregar" a la vez, solo una gana
  const apartado = await Apartado.findOneAndUpdate(
    { _id: id, estado: { $ne: 'ENTREGADO' } },
    { $set: { estado: 'ENTREGADO' } },
    { new: false }
  ).lean();

  if (!apartado) {
    const existe = await Apartado.exists({ _id: id });
    return existe ? res.status(400).json({ error: 'Ya fue entregado' }) : res.status(404).json({ error: 'Apartado no encontrado' });
  }

  try {
    // 1. Ingreso del saldo pendiente
    if (apartado.faltante > 0) {
      await Ingreso.create({
        monto: apartado.faltante,
        concepto: `Cobro final de ₡${apartado.faltante} - Apartado Entregado a: ${apartado.cliente}`,
        tipo: 'Cancelación Apartado',
        fecha: new Date(),
        vendedor: apartado.vendedor,
        apartadoId: apartado._id,
      });
    }

    // 2. Venta: los productos se guardan en el formato estándar (tipoVenta/productoId)
    //    para que, si luego se elimina la venta, el stock se devuelva correctamente.
    const productos = (apartado.productos || []).map((p) => ({
      ...p,
      nombre: p.tipoPedido === 'stock' ? (p.productoObj?.name || p.busqueda) : p.descripcionManual,
      tipoVenta: p.tipoPedido === 'stock' ? 'stock' : 'pedido',
      productoId: p.tipoPedido === 'stock' ? (p.productoObj?._id || p.productoObj?.id) : undefined,
    }));
    const totalCantidad = productos.reduce((sum, p) => sum + (Number(p.cantidad) || 1), 0);
    const resumenChemas = productos.map((p) => `${p.cantidad}x ${p.nombre} (${p.talla})`).join(' + ');

    await Venta.create({
      nombre: apartado.cliente,
      cedula: apartado.cedula || 'N/A',
      numero: apartado.telefono || 'N/A',
      totalPago: apartado.precioTotal - (apartado.costoEnvio || 0),
      costoEnvio: apartado.costoEnvio || 0,
      direccionEnvio: apartado.direccionEnvio || '',
      montoTotal: apartado.precioTotal,
      tallaVendida: productos[0]?.talla || 'N/A',
      cantidad: totalCantidad,
      productoNombre: resumenChemas,
      productos,
      vendedor: apartado.vendedor,
      fecha: new Date(),
      apartadoId: apartado._id,
    });

    res.status(200).json({ mensaje: 'Entregado con éxito' });
  } catch (error) {
    // Si falla, se revierte el estado y el ingreso del cobro final para no dejar datos a medias
    await Apartado.findByIdAndUpdate(id, { estado: apartado.estado }).catch(() => {});
    await Ingreso.deleteMany({ apartadoId: apartado._id, tipo: 'Cancelación Apartado' }).catch(() => {});
    console.error('Error al registrar finanzas/venta:', error);
    res.status(500).json({ error: 'Error al entregar' });
  }
};

export const cambiarEstadoApartado = async (req, res) => {
  try {
    const { id } = req.params;
    const estado = asString(req.body.estado);
    if (!ESTADOS_EDITABLES.includes(estado)) {
      return res.status(400).json({ error: 'Estado inválido. Para entregar usa el botón "Entregar".' });
    }
    const updated = await Apartado.findOneAndUpdate(
      { _id: id, estado: { $ne: 'ENTREGADO' } },
      { $set: { estado } },
      { new: true }
    ).catch(() => null);
    if (!updated) return res.status(404).json({ error: 'Apartado no encontrado o ya entregado' });
    res.json({ mensaje: 'Estado actualizado correctamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar el estado' });
  }
};

export const eliminarApartado = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.status(404).json({ error: 'Apartado no encontrado' });

    // Borrado atómico de un apartado NO entregado (uno entregado ya es una venta)
    const apartado = await Apartado.findOneAndDelete({ _id: id, estado: { $ne: 'ENTREGADO' } }).lean();
    if (!apartado) {
      const existe = await Apartado.exists({ _id: id });
      return existe
        ? res.status(400).json({ error: 'Este apartado ya fue entregado. Para anularlo elimina la venta desde el reporte.' })
        : res.status(404).json({ error: 'Apartado no encontrado' });
    }

    // 1. Devolver las chemas al stock (atómico)
    const ajustes = await adjustMany(itemsDeStock(apartado.productos).map((i) => ({ productId: i.productId, talla: i.talla, delta: i.cantidad, nombre: i.nombre })));
    const fallidos = ajustes.filter((a) => !a.ok);
    if (fallidos.length) console.warn('⚠️ Apartado eliminado sin devolver stock en:', fallidos.map((f) => `${f.nombre} (${f.talla}): ${f.reason}`).join(' | '));

    // 2. Eliminar SOLO el abono de este apartado
    let abonoEliminado = await Ingreso.findOneAndDelete({ apartadoId: apartado._id, tipo: 'Abono Apartado' });
    if (!abonoEliminado && apartado.abono > 0) {
      // Apartados viejos (sin enlace): coincidencia EXACTA de monto + concepto, nunca por patrón
      abonoEliminado = await Ingreso.findOneAndDelete({
        apartadoId: { $exists: false },
        tipo: 'Abono Apartado',
        monto: apartado.abono,
        concepto: `Abono de ₡${apartado.abono} - Apartado Cliente: ${apartado.cliente}`,
      });
    }

    res.json({
      mensaje: 'Apartado eliminado exitosamente.',
      stockDevuelto: ajustes.filter((a) => a.ok).length,
      abonoEliminado: Boolean(abonoEliminado),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al eliminar el apartado' });
  }
};
