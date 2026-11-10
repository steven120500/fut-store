import express from 'express';
import axios from 'axios';
import Order from '../models/Order.js'; 
import Product from '../models/Product.js'; 
import Sale from '../models/Sale.js'; 
import sendEmail from '../utils/sendEmail.js'; 
import { escapeHtml, asString } from '../utils/security.js';
import { adjustMany } from '../utils/stock.js';
import crypto from 'crypto';

const router = express.Router();

// Resumen seguro para la página de confirmación (sin dirección, teléfono, cédula ni correo)
const resumenPedido = (order) => ({
  orderId: order.orderId,
  firstName: String(order.customer?.name || '').trim().split(' ')[0] || '',
  total: order.total,
  shipping: { method: order.shipping?.method || '', cost: order.shipping?.cost || 0 },
  items: (order.items || []).map((i) => ({ name: i.name, size: i.size, quantity: i.quantity, price: i.price, image: i.image })),
  status: order.status,
});

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
    const { cliente, productos, envio } = req.body;
    const API_KEY = process.env.TILOPAY_API_KEY?.trim(); 
    
    const FRONTEND = process.env.FRONTEND_URL || "https://fut-store.onrender.com";
    // Número de pedido NO adivinable (antes era solo la hora en milisegundos)
    const orderRef = `ORD-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`; 

    // --- 0. RECALCULAR EL TOTAL EN EL SERVIDOR ---
    // Nunca se confía en los precios/total que manda el navegador (se podían manipular).
    // Misma regla que el checkout: (discountPrice || price) × cantidad + envío.
    const ENVIOS_PERMITIDOS = new Set([0, 3500, 4000, 5000]);
    if (!Array.isArray(productos) || productos.length === 0 || productos.length > 50) {
      return res.status(400).json({ message: "El carrito está vacío o es inválido" });
    }

    const itemsVerificados = [];
    let subtotal = 0;
    for (const prod of productos) {
      const productId = asString(String(prod?._id || prod?.id || ""));
      const dbProduct = productId
        ? await Product.findById(productId).select('name price discountPrice').lean().catch(() => null)
        : null;
      if (!dbProduct) {
        return res.status(400).json({ message: "Uno de los productos ya no está disponible" });
      }
      const cantidad = Math.min(Math.max(parseInt(prod.cantidad, 10) || 1, 1), 20);
      const precioUnitario = Number(dbProduct.discountPrice) || Number(dbProduct.price) || 0;
      subtotal += precioUnitario * cantidad;
      itemsVerificados.push({
        product_id: productId,
        name: dbProduct.name,
        size: asString(prod.tallaSeleccionada) || "Estándar",
        version: asString(prod.version),
        quantity: cantidad,
        price: precioUnitario,
        image: Array.isArray(prod.imgs) ? asString(prod.imgs[0]) : "",
      });
    }

    const costoEnvio = Number(envio?.precio) || 0;
    if (!ENVIOS_PERMITIDOS.has(costoEnvio)) {
      return res.status(400).json({ message: "Método de envío inválido" });
    }
    const total = subtotal + costoEnvio;
    if (total <= 0) return res.status(400).json({ message: "Total inválido" });

    // --- 1. GUARDAR ORDEN EN ESTADO PENDIENTE ---
    try {
        const newOrder = new Order({
            orderId: orderRef,
            customer: {
                cedula: cliente?.cedula || "Sin Cédula", // 👈 AGREGADO AQUÍ
                name: cliente?.nombre || "Cliente",
                email: cliente?.correo || "sin_correo@email.com",
                phone: cliente?.telefono || "",       
                address: cliente?.direccion || ""     
            },
            items: itemsVerificados,
            shipping: {
                method: asString(envio?.metodo) || "Estándar",
                cost: costoEnvio
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
        return res.json({ url: linkResponse.data.url });
    } catch (appError) {
        console.error("❌ Error TiloPay al generar link:", JSON.stringify(appError.response?.data));
        res.status(500).json({ message: "Error en la pasarela de pago" });
    }
  } catch (error) { 
    console.error("Error general en create-link:", error);
    res.status(500).json({ message: "Error interno del servidor" }); 
  }
});

// --- RUTA 2: CONFIRMAR PAGO, RESTAR STOCK Y ENVIAR CORREOS ---
router.post('/confirm-payment', async (req, res) => {
  try {
    const orderId = asString(req.body.orderId);
    if (!orderId) return res.status(400).json({ message: "Orden inválida" });

    // Transición atómica pendiente → pagado: si llegan dos confirmaciones a la vez, solo UNA
    // descuenta stock, registra la venta y manda correos. (El pago aún se debe revisar en TiloPay.)
    const order = await Order.findOneAndUpdate(
      { orderId, status: 'pending' },
      { $set: { status: 'paid', stockDiscounted: true } },
      { new: false }
    );
    if (!order) {
      const existente = await Order.findOne({ orderId });
      if (!existente) return res.status(404).json({ message: "Orden no encontrada" });
      if (existente.status === 'cancelled') return res.status(409).json({ message: "Este pedido fue cancelado." });
      return res.json({ message: "El pedido ya había sido procesado.", status: 'paid', order: resumenPedido(existente) });
    }

    // 3. RESTAR STOCK (atómico) — solo si este pedido no lo había descontado antes
    if (!order.stockDiscounted) {
      const ajustes = await adjustMany(order.items.map((item) => ({ productId: item.product_id, talla: item.size, delta: -(Number(item.quantity) || 1), nombre: item.name })));
      const fallidos = ajustes.filter((x) => !x.ok);
      if (fallidos.length) console.warn(`⚠️ Pedido ${orderId}: sin descontar stock en`, fallidos.map((f) => `${f.nombre} (${f.talla}): ${f.reason}`).join(' | '));
    }
    order.status = 'paid';
    console.log(`✅ Pedido ${orderId} marcado como pagado (verificar en TiloPay).`);

    // 🌟 4.5. REGISTRAR LA VENTA AUTOMÁTICAMENTE EN EL PANEL GENERAL (BLINDADO) 🌟
    try {
      const totalCant = order.items.reduce((acc, item) => acc + (Number(item.quantity) || 1), 0);
      const primerItem = order.items[0] || {};

      const nuevaVenta = new Sale({
        cedula: order.customer.cedula || "Compra Web",
        nombre: order.customer.name || "Cliente Web",
        numero: order.customer.phone || "00000000",
        totalPago: order.total - (order.shipping?.cost || 0),
        costoEnvio: order.shipping?.cost || 0,
        direccionEnvio: order.customer.address || "Recoger en el Local",
        montoTotal: order.total,
        cantidad: totalCant,
        productoNombre: primerItem.name || "Camiseta Web",
        tallaVendida: primerItem.size || "Estándar",
        productos: order.items.map(item => ({
          nombre: item.name,           // ✅ Compatible con el reporte diario
          productoNombre: item.name,   // ✅ Respaldo
          talla: item.size,            // ✅ Compatible con el reporte diario
          tallaVendida: item.size,     // ✅ Respaldo
          version: item.version || "", // ✅ Lee la versión (Player / Fan)
          cantidad: item.quantity || 1,
          precio: item.price,
          tipoVenta: 'stock',          // ✅ Si se elimina la venta, el stock se devuelve
          productoId: item.product_id ? String(item.product_id) : undefined
        })),
        orderId: order.orderId,
        vendedor: 'Web - TiloPay',
        archivado: false
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
        <p>¡Hola <strong>${escapeHtml(order.customer.name)}</strong>!</p>
        <p>Tu pago ha sido aprobado y tu pedido <strong>#${order.orderId}</strong> está confirmado.</p>
        
        <div style="background-color: #111; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3 style="color: #9E8F91; margin-top: 0;">Detalle de Compra:</h3>
          <p>Total pagado: <strong>₡${order.total.toLocaleString()}</strong></p>
          <p>Dirección: ${escapeHtml(order.customer.address)}</p>
        </div>
        
        <p style="font-size: 13px; color: #999;">Nos prepararemos para despachar tu paquete lo antes posible.</p>
        <p style="text-align: center; color: #9E8F91; margin-top: 30px;">FutStore Costa Rica 🇨🇷</p>
      </div>
    `;

    const adminHTML = `
      <div style="font-family: sans-serif; border: 4px solid #2ecc71; padding: 20px; color: #000;">
        <h2 style="color: #27ae60; margin-top: 0;">💰 ¡NUEVO PAGO EN WEB!</h2>
        <p><strong>Cliente:</strong> ${escapeHtml(order.customer.name)}</p>
        <p><strong>Cédula:</strong> ${escapeHtml(order.customer.cedula || "N/A")}</p>
        <p><strong>Monto PAGADO:</strong> ₡${order.total.toLocaleString()}</p>
        <p><strong>Orden:</strong> #${order.orderId}</p>
        <p><strong>Teléfono:</strong> ${escapeHtml(order.customer.phone)}</p>
        <br />
        <a href="https://futstorecr.com/pedidos" style="background: #000; color: #fff; padding: 10px 20px; text-decoration: none; font-weight: bold; border-radius: 5px;">VER EN TABLERO</a>
      </div>
    `;

    // Disparar correos sin bloquear la respuesta
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

    res.json({ success: true, message: "Transacción aprobada. Pedido en proceso.", order: resumenPedido(order) });

  } catch (error) { 
    console.error("Error confirmando pago:", error);
    res.status(500).json({ message: "Error interno verificando la transacción" }); 
  }
});

export default router;  