import express from 'express';
import axios from 'axios';
import Order from '../models/Order.js'; 
import Product from '../models/Product.js'; 
import Sale from '../models/Sale.js'; // 👈 Importamos el modelo de ventas
import sendEmail from '../utils/sendEmail.js'; 

const router = express.Router();

// Función auxiliar para login en Tilopay (reutilizable)
const getTiloPayToken = async () => {
    const API_USER = process.env.TILOPAY_USER?.trim();
    const API_PASSWORD = process.env.TILOPAY_PASSWORD?.trim();
    if (!API_USER || !API_PASSWORD) throw new Error("Faltan credenciales de TiloPay en el servidor.");

    const res = await axios.post('https://app.tilopay.com/api/v1/login', {
        apiuser: API_USER,
        password: API_PASSWORD
    });
    return res.data.access_token || res.data.token || res.data;
};

// --- RUTA 1: CREAR LINK DE PAGO Y DEJAR ORDEN PENDIENTE ---
router.post('/create-link', async (req, res) => {
  try {
    const { cliente, total, productos, envio } = req.body;
    const API_KEY = process.env.TILOPAY_API_KEY?.trim(); 
    
    // Asegurar que la URL sea segura para la redirección
    const FRONTEND = process.env.FRONTEND_URL || "https://fut-store.onrender.com";
    const orderRef = `ORD-${Date.now()}`; 

    // --- 1. GUARDAR ORDEN EN ESTADO PENDIENTE ---
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
        console.log(`📝 Pedido ${orderRef} guardado en BD (Pendiente de pago).`);
    } catch (dbError) {
        console.error("❌ Error guardando pedido pendiente:", dbError);
        return res.status(500).json({ message: "Error al crear el pedido preliminar" });
    }

    // --- 2. PEDIR PERMISO A TILOPAY ---
    let token;
    try {
        token = await getTiloPayToken();
    } catch (e) {
        return res.status(401).json({message: "Error de autenticación con el banco."}); 
    }

    // --- 3. ARMAR PAQUETE Y ENVIAR AL BANCO ---
    const fullName = cliente?.nombre || "Cliente General";
    const nameParts = fullName.trim().split(" ");
    
    const payload = {
      key: API_KEY, 
      amount: total,
      currency: "CRC",
      // Tilopay redireccionará aquí y el Frontend leerá si pagó o no
      redirect: `${FRONTEND}/checkout?order=${orderRef}`, 
      
      billToFirstName: nameParts[0],
      billToLastName: nameParts.slice(1).join(" ") || "Cliente",
      billToEmail: cliente?.correo || "info@futstorecr.com",
      billToTelephone: cliente?.telefono || "00000000",
      billToAddress: cliente?.direccion || "Costa Rica", 
      billToCity: "San Jose",
      billToState: "San Jose",
      billToZipPostCode: "10101",
      billToCountry: "CR",
      
      orderNumber: orderRef, 
      description: `FUTSTORE CR - ${productos?.length || 1} artículos`
    };
    
    try {
        const linkResponse = await axios.post('https://app.tilopay.com/api/v1/processPayment', payload, { 
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', 'Accept': 'application/json' } 
        });
        // Devolvemos el link seguro para que el frontend redirija
        return res.json({ url: linkResponse.data.url });
    } catch (appError) {
        console.error("❌ Error TiloPay al generar link:", JSON.stringify(appError.response?.data));
        res.status(500).json({ message: "Error en la pasarela de pago", detalle: appError.response?.data });
    }
  } catch (error) { 
    console.error("Error general en create-link:", error);
    res.status(500).json({ message: "Error interno del servidor" }); 
  }
});

// --- RUTA 2: CONFIRMAR PAGO, RESTAR STOCK Y ENVIAR CORREOS ---
router.post('/confirm-payment', async (req, res) => {
  try {
    const { orderId } = req.body;
    
    // 1. Verificar existencia de la orden
    const order = await Order.findOne({ orderId });
    if (!order) return res.status(404).json({ message: "Orden no encontrada" });
    if (order.status === 'paid') return res.json({ message: "El pedido ya había sido procesado.", status: 'paid' });

    // 3. RESTAR STOCK (BLINDADO CON ESTRUCTURA MONGOOSE Y DOBLE DESCUENTO)
    if (!order.stockDiscounted) {
        for (const item of order.items) {
          if (item.product_id) {
            try {
              const product = await Product.findById(item.product_id);
              if (product && product.stock && product.stock[item.size] !== undefined) {
                   const talla = String(item.size);
                   const currentStock = Number(product.stock[talla]) || 0;
                   
                   // Reasignamos el objeto completo para forzar el guardado
                   product.stock = {
                     ...product.stock,
                     [talla]: Math.max(0, currentStock - item.quantity)
                   };
                   
                   product.markModified('stock');
                   await product.save();
                   console.log(`📉 Stock actualizado por pago web: ${product.name} (Talla: ${talla})`);
              }
            } catch (err) {
              console.error(`Aviso: Error restando stock del producto ${item.product_id} tras pago.`, err.message);
            }
          }
        }
        
        // Marcamos que ya se descontó para que no vuelva a pasar
        order.stockDiscounted = true;
    }
    
    // 4. MARCAR COMO PAGADO
    order.status = 'paid';
    await order.save();
    console.log(`✅ Pedido ${orderId} marcado como pagado exitosamente.`);

    // 🌟 4.5. REGISTRAR LA VENTA AUTOMÁTICAMENTE EN EL PANEL GENERAL 🌟
    try {
      const nuevaVenta = new Sale({
        cedula: "N/A - Compra Web",
        nombre: order.customer.name || "Cliente Web",
        numero: order.customer.phone || "00000000",
        totalPago: order.total - (order.shipping?.cost || 0),
        costoEnvio: order.shipping?.cost || 0,
        direccionEnvio: order.customer.address || "N/A",
        montoTotal: order.total,
        productos: order.items.map(item => ({
          productoNombre: item.name,
          tallaVendida: item.size,
          cantidad: item.quantity,
          precio: item.price
        })),
        vendedor: 'Web - TiloPay' 
      });

      await nuevaVenta.save();
      console.log(`💰 Venta Web registrada en la caja general por ₡${order.total}`);
    } catch (saleErr) {
      console.error("⚠️ Error registrando la venta en el panel general:", saleErr.message);
    }
    
    // --- 5. ENVIAR CORREOS AUTOMÁTICOS ---
    const clienteHTML = `
      <div style="background-color: #000; color: #fff; padding: 30px; font-family: 'Helvetica', Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #9E8F91;">
        <h1 style="text-align: center; letter-spacing: 3px; color: #fff;">FUTSTORE</h1>
        <hr style="border-color: #333;" />
        <p>¡Hola <strong>${order.customer.name}</strong>!</p>
        <p>Tu pago ha sido aprobado y tu pedido <strong>#${order.orderId}</strong> está confirmado.</p>
        
        <div style="background-color: #111; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3 style="color: #9E8F91; margin-top: 0;">Detalle de Compra:</h3>
          <p>Total pagado: <strong>₡${order.total.toLocaleString()}</strong></p>
          <p>Dirección: ${order.customer.address}</p>
        </div>
        
        <p style="font-size: 13px; color: #999;">Nos prepararemos para despachar tu paquete lo antes posible.</p>
        <p style="text-align: center; color: #9E8F91; margin-top: 30px;">FutStore Costa Rica 🇨🇷</p>
      </div>
    `;

    const adminHTML = `
      <div style="font-family: sans-serif; border: 4px solid #2ecc71; padding: 20px; color: #000;">
        <h2 style="color: #27ae60; margin-top: 0;">💰 ¡NUEVO PAGO EN WEB!</h2>
        <p><strong>Cliente:</strong> ${order.customer.name}</p>
        <p><strong>Monto PAGADO:</strong> ₡${order.total.toLocaleString()}</p>
        <p><strong>Orden:</strong> #${order.orderId}</p>
        <p><strong>Teléfono:</strong> ${order.customer.phone}</p>
        <br />
        <a href="https://futstorecr.com/pedidos" style="background: #000; color: #fff; padding: 10px 20px; text-decoration: none; font-weight: bold; border-radius: 5px;">VER EN TABLERO</a>
      </div>
    `;

    // Disparamos los correos sin 'await' para que la respuesta web sea instantánea (Corregida la sintaxis del asunto del cliente)
    Promise.all([
      sendEmail({ 
        email: order.customer.email, 
        subject: `Factura de Compra #${order.orderId} - FutStore CR`, 
        message: clienteHTML 
      }),
      sendEmail({ 
        email: 'futstorecrchemas@gmail.com',
        subject: `🚨 VENTA WEB PAGADA: ₡${order.total}`, 
        message: adminHTML 
      })
    ]).catch(err => console.error("Error silencioso enviando correos:", err.message));

    // Responder éxito al Frontend
    res.json({ success: true, message: "Transacción aprobada. Pedido en proceso." });

  } catch (error) { 
    console.error("Error confirmando pago:", error);
    res.status(500).json({ message: "Error interno verificando la transacción" }); 
  }
});

export default router;