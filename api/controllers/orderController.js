export const createOrder = async (req, res) => {
    try {
      // 1. Guardar en MongoDB (Esto debe ser rápido)
      const order = await Order.create(req.body);
  
      // 2. Definir plantillas (clienteHTML y adminHTML se mantienen igual...)
      const clienteHTML = `...`; 
      const adminHTML = `...`;
  
      // 3. 🚀 CAMBIO CLAVE: Enviar correos en "segundo plano"
      // Quitamos el 'await'. El servidor NO esperará a que se envíen para seguir.
      Promise.all([
        sendEmail({
          email: order.customer.email,
          subject: `Factura de Compra #${order.orderId} - FutStore`,
          message: clienteHTML,
        }),
        sendEmail({
          email: 'scorrales18@gmail.com',
          subject: `🚨 NUEVA VENTA: ₡${order.total}`,
          message: adminHTML,
        })
      ]).catch(err => {
        // Si los correos fallan, solo lo logueamos, no matamos la orden
        console.error("Error enviando correos post-venta:", err);
      });
  
      // 4. Responder de inmediato a la pasarela/frontend
      res.status(201).json(order);
  
    } catch (error) {
      console.error("Error al crear la orden:", error);
      res.status(400).json({ message: "Error al crear la orden", error: error.message });
    }
  };