import express from 'express';
import axios from 'axios';
import Order from '../models/Order.js'; 
import Product from '../models/Product.js'; 
import sendEmail from '../utils/sendEmail.js'; 

const router = express.Router();

// --- RUTA 1: CREAR LINK DE PAGO (Y guardar pedido) ---
router.post('/create-link', async (req, res) => {
  try {
    const { cliente, total, productos, envio } = req.body;
    
    // 1. CREDENCIALES DE PRODUCCIÓN (Deben estar en Render)
    const API_USER = process.env.TILOPAY_USER?.trim();
    const API_PASSWORD = process.env.TILOPAY_PASSWORD?.trim();
    const API_KEY = process.env.TILOPAY_API_KEY?.trim(); 
    
    // Redirección al frontend
    const FRONTEND = process.env.FRONTEND_URL || "https://futstorecr.com";

    const orderRef = `ORD-${Date.now()}`; 

    // --- 2. GUARDAR DATOS EN MONGO DB ---
    try {
        const newOrder = new Order({
            orderId: orderRef,
            customer: {
                name: cliente?.nombre || "Cliente",
                email: cliente?.correo || "sin_correo@email.com",
                phone: cliente?.telefono || "",       
                address: cliente?.direccion || ""     
            },
            items: productos.map(prod => ({
                product_id: prod._id || prod.id, 
                name: prod.nombre || prod.title,
                size: prod.tallaSeleccionada || "Estándar",
                version: prod.version || "",             
                quantity: prod.cantidad || 1,
                price: prod.precio,
                image: prod.imgs ? prod.imgs[0] : "" 
            })),
            shipping: {
                method: envio?.metodo || "Estándar",
                cost: envio?.precio || 0
            },
            total: total,
            status: 'pending' 
        });

        await newOrder.save();
        console.log(`📝 Pedido ${orderRef} guardado correctamente (Pendiente).`);

    } catch (dbError) {
        console.error("❌ Error guardando pedido:", dbError);
        return res.status(500).json({ message: "Error al crear el pedido en base de datos" });
    }

    // --- 3. LOGIN TILOPAY (PRODUCCIÓN) ---
    if (!API_USER || !API_PASSWORD || !API_KEY) return res.status(500).json({ message: "Faltan credenciales" });

    let token = "";
    try {
      // ✅ URL OFICIAL DEL BANCO REAL
      const loginResponse = await axios.post('https://app.tilopay.com/api/v1/login', {
        apiuser: API_USER,
        password: API_PASSWORD
      });
      token = loginResponse.data.access_token || loginResponse.data.token || loginResponse.data;
    } catch (e) { 
      console.error("Error Login TiloPay:", e.response?.data || e.message);
      return res.status(401).json({message: "Error Login TiloPay"}); 
    }

    // --- 4. CONFIGURAR PAYLOAD TILOPAY ---
    const fullName = cliente?.nombre || "Cliente General";
    const nameParts = fullName.trim().split(" ");
    
    const payload = {
      key: API_KEY, 
      amount: total,
      currency: "CRC",
      redirect: `${FRONTEND}/checkout?order=${orderRef}`,
      
      billToFirstName: nameParts[0],
      billToLastName: nameParts.slice(1).join(" ") || "Cliente",
      billToEmail: cliente?.correo || "cliente@email.com",
      billToTelephone: cliente?.telefono || "88888888",
      billToAddress: cliente?.direccion || "San Jose", 
      billToCity: "San Jose",
      billToState: "San Jose",
      billToZipPostCode: "10101",
      billToCountry: "CR",
      
      orderNumber: orderRef, 
      description: `Compra FutStore - ${productos?.length || 1} items`
    };
    
    // --- 5. ENVIAR A TILOPAY (PRODUCCIÓN) ---
    try {
        // ✅ URL OFICIAL DE PAGOS
        const linkResponse = await axios.post('https://app.tilopay.com/api/v1/processPayment', payload, { 
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', 'Accept': 'application/json' } 
        });
        return res.json({ url: linkResponse.data.url });
    } catch (appError) {
        console.error("❌ Error TiloPay:", JSON.stringify(appError.response?.data));
        res.status(500).json({ message: "Error TiloPay", detalle: appError.response?.data });
    }
  } catch (error) { 
    console.error("Error general en create-link:", error);
    res.status(500).json({ message: "Error interno" }); 
  }
});

// --- RUTA 2: CONFIRMAR PAGO, RESTAR STOCK Y ENVIAR CORREOS ---
router.post('/confirm-payment', async (req, res) => {
  try {
    const { orderId } = req.body;
    const order = await Order.findOne({ orderId });
    if (!order) return res.status(404).json({ message: "Orden no encontrada" });

    if (order.status === 'paid') return res.json({ message: "Ya procesada", status: 'paid' });

    // 1. Restar Stock
    for (const item of order.items) {
      if (item.product_id) {
        const product = await Product.findById(item.product_id);
        if (product && product.stock && product.stock[item.size] !== undefined) {
             const currentStock = parseInt(product.stock[item.size] || 0);
             product.stock[item.size] = Math.max(0, currentStock - item.quantity);
             await product.save();
             console.log(`📉 Stock actualizado: ${product.name} (${item.size})`);
        }
      }
    }
    
    // 2. Marcar como pagado en MongoDB
    order.status = 'paid';
    await order.save();
    console.log(`✅ Pedido ${orderId} pagado con éxito.`);
    
    // --- 3. 🚀 ENVIAR CORREOS AUTOMÁTICOS EN SEGUNDO PLANO ---
    const clienteHTML = `
      <div style="background-color: #000; color: #fff; padding: 30px; font-family: 'Helvetica', Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #9E8F91;">
        <h1 style="text-align: center; letter-spacing: 3px; color: #fff;">FUTSTORE</h1>
        <hr style="border-color: #333;" />
        <p>¡Hola <strong>${order.customer.name}</strong>!</p>
        <p>Tu pago ha sido aprobado y tu pedido <strong>#${order.orderId}</strong> está confirmado.</p>
        
        <div style="background-color: #111; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3 style="color: #9E8F91; margin-top: 0;">Detalle:</h3>
          <p>Total pagado: <strong>₡${order.total.toLocaleString()}</strong></p>
          <p>Enviado a: ${order.customer.address}</p>
        </div>
        
        <p style="font-size: 13px; color: #999;">Nos prepararemos para despachar tu paquete muy pronto.</p>
        <p style="text-align: center; color: #9E8F91; margin-top: 30px;">FutStore Costa Rica 🇨🇷 | info@futstorecr.com</p>
      </div>
    `;

    const adminHTML = `
      <div style="font-family: sans-serif; border: 4px solid #2ecc71; padding: 20px; color: #000;">
        <h2 style="color: #27ae60; margin-top: 0;">💰 ¡PAGO CONFIRMADO!</h2>
        <p><strong>Cliente:</strong> ${order.customer.name}</p>
        <p><strong>Monto:</strong> ₡${order.total.toLocaleString()}</p>
        <p><strong>ID de Orden:</strong> #${order.orderId}</p>
        <p><strong>WhatsApp:</strong> ${order.customer.phone}</p>
        <br />
        <a href="https://futstorecr.com/pedidos" style="background: #000; color: #fff; padding: 10px 20px; text-decoration: none; font-weight: bold; border-radius: 5px;">GESTIONAR ENVÍO</a>
      </div>
    `;

    // Disparamos los correos sin 'await' para que la respuesta sea instantánea al cliente
    Promise.all([
      sendEmail({ 
        email: order.customer.email, 
        subject: `Factura de Compra #${order.orderId} - FutStore`, 
        message: clienteHTML 
      }),
      sendEmail({ 
        email: 'scorrales18@gmail.com',
        subject: `🚨 VENTA PAGADA: ₡${order.total}`, 
        message: adminHTML 
      })
    ]).catch(err => console.error("Error silencioso enviando correos:", err));
    // ---------------------------------------------------------

    // 4. Responder éxito al Frontend
    res.json({ success: true, message: "Pago confirmado y stock actualizado." });

  } catch (error) { 
    console.error("Error confirmando pago:", error);
    res.status(500).json({ message: "Error interno confirmando el pago" }); 
  }
});

export default router;