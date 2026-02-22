import Order from '../models/Order.js';
import sendEmail from '../utils/sendEmail.js';

// --- 1. CREAR NUEVA ORDEN + ENVIAR CORREOS ---
export const createOrder = async (req, res) => {
  try {
    // Guardar en MongoDB
    const order = await Order.create(req.body);

    // 📄 PLANTILLA PARA EL CLIENTE (Diseño Negro y Dorado)
    const clienteHTML = `
      <div style="background-color: #000; color: #fff; padding: 30px; font-family: 'Helvetica', Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #9E8F91;">
        <div style="text-align: center; border-bottom: 2px solid #9E8F91; padding-bottom: 20px; margin-bottom: 20px;">
          <h1 style="color: #fff; letter-spacing: 5px; margin: 0;">FUTSTORE</h1>
          <p style="color: #9E8F91; font-style: italic; margin: 5px 0 0 0;">Confirmación de Compra</p>
        </div>
        
        <p>Hola <strong>${order.customer.name}</strong>,</p>
        <p>Tu pedido ha sido recibido con éxito. Aquí tienes el resumen de tu orden:</p>
        
        <div style="background-color: #111; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3 style="color: #9E8F91; margin-top: 0;">Orden: #${order.orderId}</h3>
          <table style="width: 100%; color: #fff; border-collapse: collapse;">
            <tbody>
              ${order.items.map(item => `
                <tr style="border-bottom: 1px solid #222;">
                  <td style="padding: 10px 0;">${item.name} (Talla: ${item.size}) x${item.quantity}</td>
                  <td style="text-align: right; padding: 10px 0;">₡${item.price.toLocaleString()}</td>
                </tr>
              `).join('')}
            </tbody>
            <tfoot>
              <tr>
                <td style="padding-top: 20px; font-weight: bold; color: #9E8F91;">TOTAL PAGADO</td>
                <td style="padding-top: 20px; text-align: right; font-weight: bold; font-size: 1.2em; color: #fff;">₡${order.total.toLocaleString()}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        <p style="font-size: 14px; color: #999;"><strong>Dirección de entrega:</strong><br>${order.customer.address}</p>
        <p style="text-align: center; margin-top: 40px; font-size: 12px; color: #9E8F91;">FutStore Costa Rica | info@futstorecr.com</p>
      </div>
    `;

    // 🚨 PLANTILLA PARA TI (Notificación de Venta)
    const adminHTML = `
      <div style="font-family: sans-serif; color: #000; padding: 20px; border: 4px solid #2ecc71;">
        <h1 style="color: #27ae60;">💰 ¡NUEVA VENTA!</h1>
        <hr />
        <p><strong>Cliente:</strong> ${order.customer.name}</p>
        <p><strong>Monto:</strong> ₡${order.total.toLocaleString()}</p>
        <p><strong>WhatsApp:</strong> ${order.customer.phone}</p>
        <p><strong>ID de Orden:</strong> #${order.orderId}</p>
        <hr />
        <a href="https://futstorecr.com/pedidos" style="display: inline-block; padding: 10px 20px; background-color: #000; color: #fff; text-decoration: none; font-weight: bold; border-radius: 5px;">GESTIONAR ENVÍO</a>
      </div>
    `;

    // Enviar correos simultáneamente
    await Promise.all([
      sendEmail({
        email: order.customer.email,
        subject: `Factura de Compra #${order.orderId} - FutStore`,
        message: clienteHTML,
      }),
      sendEmail({
        email: 'scorrales18@gmail.com', // 👈 Tu correo de admin
        subject: `🚨 NUEVA VENTA: ₡${order.total}`,
        message: adminHTML,
      })
    ]);

    res.status(201).json(order);
  } catch (error) {
    res.status(400).json({ message: "Error al crear la orden", error: error.message });
  }
};

// --- 2. OBTENER TODOS LOS PEDIDOS (Para tu panel) ---
export const getOrders = async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 }); // Los más nuevos primero
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// --- 3. ACTUALIZAR ESTADO DEL PEDIDO ---
export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // ej: 'sent', 'delivered'
    const updatedOrder = await Order.findByIdAndUpdate(id, { status }, { new: true });
    res.json(updatedOrder);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// --- 4. ELIMINAR PEDIDO ---
export const deleteOrder = async (req, res) => {
  try {
    await Order.findByIdAndDelete(req.params.id);
    res.json({ message: "Pedido eliminado correctamente" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};