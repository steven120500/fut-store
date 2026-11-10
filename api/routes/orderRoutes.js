import express from 'express';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import History from '../models/History.js'; // 👈 IMPORTAMOS EL MODELO DEL HISTORIAL
import sendEmail from '../utils/sendEmail.js'; 
import { escapeHtml } from '../utils/security.js';
import { requireAuth, actorName } from '../middleware/auth.js';
import { adjustMany } from '../utils/stock.js';

const ESTADOS_PEDIDO = ['pending', 'paid', 'sent', 'cancelled'];

const router = express.Router();
router.use(requireAuth); // pedidos contienen datos personales de clientes: solo personal

// 1. OBTENER TODOS
router.get('/', async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener pedidos" });
  }
});

// 2. ACTUALIZAR ESTADO
router.put('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    if (!ESTADOS_PEDIDO.includes(status)) return res.status(400).json({ message: "Estado de pedido inválido" });
    const order = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true, runValidators: true }).catch(() => null);
    if (!order) return res.status(404).json({ message: "Orden no encontrada" });
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: "Error actualizando estado" });
  }
});

// 3. ELIMINAR ORDEN
router.delete('/:id', async (req, res) => {
  try {
    await Order.findByIdAndDelete(req.params.id);
    res.json({ message: "Orden eliminada correctamente" });
  } catch (error) {
    res.status(500).json({ message: "Error al eliminar la orden" });
  }
});

// 4. ENVIAR GUÍA DE CORREOS DE COSTA RICA
router.post('/:id/send-tracking', async (req, res) => {
    try {
        const { id } = req.params;
        const trackingNumber = String(req.body.trackingNumber ?? '').trim().slice(0, 60);
        if (!trackingNumber) return res.status(400).json({ message: "Ingresa el número de guía" });
        
        const order = await Order.findById(id);
        if (!order) return res.status(404).json({ message: "Orden no encontrada" });

        const trackingHTML = `
            <div style="background-color: #000; color: #fff; padding: 30px; font-family: 'Helvetica', Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #9E8F91; text-align: center;">
                <h1 style="letter-spacing: 3px; color: #fff;">FUTSTORE</h1>
                <hr style="border-color: #333; margin-bottom: 20px;" />
                <h2 style="color: #D4AF37;">¡Tu pedido va en camino! 🚚</h2>
                <p>Hola <strong>${escapeHtml(order.customer.name)}</strong>,</p>
                <p>Hemos despachado tu pedido a través de Correos de Costa Rica.</p>
                <div style="background-color: #111; padding: 20px; border-radius: 5px; margin: 30px 0; border: 1px dashed #D4AF37;">
                    <p style="color: #9E8F91; font-size: 12px; text-transform: uppercase; margin: 0;">Tu número de guía es:</p>
                    <p style="font-size: 24px; font-weight: bold; letter-spacing: 2px; margin: 10px 0;">${escapeHtml(trackingNumber)}</p>
                </div>
                <p style="font-size: 14px; color: #ccc;">Puedes rastrear tu paquete ingresando este código en la página oficial de <a href="https://correos.go.cr/rastreo/" style="color: #D4AF37; text-decoration: none;">Correos de Costa Rica</a>.</p>
                <p style="text-align: center; color: #9E8F91; margin-top: 40px; font-size: 12px;">FutStore Costa Rica 🇨🇷 | info@futstorecr.com</p>
            </div>
        `;

        await sendEmail({
            email: order.customer.email,
            subject: `📦 Guía de Envío #${order.orderId} - FutStore`,
            message: trackingHTML,
        });

        order.status = 'sent';
        await order.save();

        res.json({ success: true, message: "Guía enviada correctamente" });

    } catch (error) {
        console.error("Error enviando guía:", error);
        res.status(500).json({ message: "Error interno enviando la guía" });
    }
});

// 👇 5. DESCONTAR STOCK Y GUARDAR EN HISTORIAL (VERSIÓN DEFINITIVA) 👇
router.post('/:orderId/discount-stock', async (req, res) => {
    try {
        // Marca atómica: si se presiona dos veces (o desde dos pantallas), solo una descuenta
        const order = await Order.findOneAndUpdate(
            { _id: req.params.orderId, stockDiscounted: { $ne: true } },
            { $set: { stockDiscounted: true } },
            { new: false }
        ).catch(() => null);

        if (!order) {
            const existe = await Order.exists({ _id: req.params.orderId }).catch(() => null);
            return existe
                ? res.status(400).json({ error: 'El stock ya fue descontado para esta orden.' })
                : res.status(404).json({ error: 'Orden no encontrada' });
        }

        const ajustes = await adjustMany(order.items.map((item) => ({
            productId: item.product_id || item.productId || item.product,
            talla: item.size,
            delta: -(Number(item.quantity) || 1),
            nombre: item.name,
        })));
        const ok = ajustes.filter((a) => a.ok);
        const fallidos = ajustes.filter((a) => !a.ok);

        await History.create({
            user: actorName(req, 'Super Admin'),
            action: "DESCUENTO DE STOCK AUTO",
            item: `Orden ${order.orderId}`,
            details: `Se restó: ${ok.map((a) => `${a.nombre} (Talla: ${a.key}) x${-a.delta}`).join(' | ') || 'nada'}${fallidos.length ? ` | ⚠️ No encontrado: ${fallidos.map((f) => `${f.nombre} (${f.talla})`).join(', ')}` : ''}`
        });

        res.json({ ok: true, message: "Stock descontado con éxito", descontados: ok.length, noEncontrados: fallidos.length });
    } catch (err) {
        console.error("Error descontando stock:", err);
        res.status(500).json({ error: "Error al actualizar inventario" });
    }
});

export default router;