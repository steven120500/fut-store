import Apartado from '../models/Apartado.js';
import Ingreso from '../models/Ingreso.js';
import Venta from '../models/Sale.js'; // Ajustado a tu Sale.js

export const crearApartado = async (req, res) => {
  try {
    const { vendedor, cliente, cedula, telefono, productos, precioTotal, abono, faltante, imagen } = req.body;

    // 1. Guardar el nuevo apartado
    const nuevoApartado = new Apartado({ 
      vendedor, cliente, cedula, telefono, productos, precioTotal, abono, faltante, imagen 
    });
    const apartadoGuardado = await nuevoApartado.save();

    // 2. Registrar el abono como un ingreso inmediato
    const nuevoIngreso = new Ingreso({
      monto: abono,
      concepto: `Abono de ${abono} - Apartado Cliente: ${cliente}`,
      tipo: 'Abono Apartado',
      fecha: new Date(),
      vendedor: vendedor
    });
    await nuevoIngreso.save();

    res.status(201).json({ 
      mensaje: 'Apartado creado y abono registrado con éxito', 
      apartado: apartadoGuardado 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Hubo un error al crear el apartado' });
  }
};

export const entregarApartado = async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Buscar el apartado
    const apartado = await Apartado.findById(id);
    if (!apartado) return res.status(404).json({ error: 'Apartado no encontrado' });
    if (apartado.estado === 'ENTREGADO') return res.status(400).json({ error: 'El pedido ya fue entregado' });

    // 2. Marcar como entregado
    apartado.estado = 'ENTREGADO';
    await apartado.save();

    // 3. Registrar el dinero faltante como ingreso (si es mayor a 0)
    if (apartado.faltante > 0) {
      const nuevoIngreso = new Ingreso({
        monto: apartado.faltante,
        concepto: `Cobro faltante de ${apartado.faltante} - Apartado Entregado a: ${apartado.cliente}`,
        tipo: 'Cancelación Apartado',
        fecha: new Date(),
        vendedor: apartado.vendedor
      });
      await nuevoIngreso.save();
    }

    // 4. Registrar como VENTA OFICIAL para que sume a "Chemas"
    const nuevaVenta = new Venta({
      cliente: apartado.cliente,
      vendedor: apartado.vendedor,
      productos: apartado.productos,
      totalGanancia: apartado.precioTotal, // El valor total del pedido
      metodoPago: 'Apartado',
      fecha: new Date()
    });
    await nuevaVenta.save();

    res.status(200).json({ mensaje: 'Apartado entregado, saldo cobrado y venta registrada exitosamente.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al procesar la entrega' });
  }
};