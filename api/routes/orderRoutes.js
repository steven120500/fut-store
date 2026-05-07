import express from 'express';
import Order from '../models/Order.js';
import Product from '../models/Product.js'; // 👈 IMPORTANTE: Importamos el modelo de productos
import sendEmail from '../utils/sendEmail.js'; 

const router = express.Router();

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
    const order = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true });
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
        const { trackingNumber } = req.body;
        
        const order = await Order.findById(id);
        if (!order) return res.status(404).json({ message: "Orden no encontrada" });

        const trackingHTML = `
            <div style="background-color: #000; color: #fff; padding: 30px; font-family: 'Helvetica', Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #9E8F91; text-align: center;">
                <h1 style="letter-spacing: 3px; color: #fff;">FUTSTORE</h1>
                <hr style="border-color: #333; margin-bottom: 20px;" />
                <h2 style="color: #D4AF37;">¡Tu pedido va en camino! 🚚</h2>
                <p>Hola <strong>${order.customer.name}</strong>,</p>
                <p>Hemos despachado tu pedido a través de Correos de Costa Rica.</p>
                <div style="background-color: #111; padding: 20px; border-radius: 5px; margin: 30px 0; border: 1px dashed #D4AF37;">
                    <p style="color: #9E8F91; font-size: 12px; text-transform: uppercase; margin: 0;">Tu número de guía es:</p>
                    <p style="font-size: 24px; font-weight: bold; letter-spacing: 2px; margin: 10px 0;">${trackingNumber}</p>
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

// 👇 5. DESCONTAR STOCK AUTOMÁTICAMENTE (NUEVO) 👇
router.post('/:orderId/discount-stock', async (req, res) => {
    try {
        const { orderId } = req.params;
        const order = await Order.findById(orderId);

        if (!order) return res.status(404).json({ error: 'Orden no encontrada' });

        // Mapeamos los artículos para restar 1 unidad de la talla específica
        const updatePromises = order.items.map(async (item) => {
            const product = await Product.findById(item.productId);
            
            // Validamos que el producto exista y la talla sea válida
            if (product && product.stock && product.stock[item.size] !== undefined) {
                const currentQty = Number(product.stock[item.size]) || 0;
                const newQty = Math.max(0, currentQty - 1);
                
                // Actualizamos usando dot notation para no borrar otras tallas
                return Product.findByIdAndUpdate(item.productId, {
                    $set: { [`stock.${item.size}`]: newQty }
                });
            }
        });

        await Promise.all(updatePromises);
        res.json({ ok: true, message: "Stock descontado con éxito" });

    } catch (err) {
        console.error("Error descontando stock:", err);
        res.status(500).json({ error: "Error al actualizar inventario" });
    }
});

export default router;