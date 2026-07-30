import Apartado from '../models/Apartado.js';
import Ingreso from '../models/Ingreso.js';
import Venta from '../models/Sale.js'; 
import Product from '../models/Product.js'; 

export const crearApartado = async (req, res) => {
  try {
    const { vendedor, cliente, cedula, telefono, productos, precioTotal, abono, faltante, imagen } = req.body;

    // 1. DESCONTAR DEL STOCK
    for (const prod of productos) {
      if (prod.tipoPedido === 'stock' && prod.productoObj) {
        const idProducto = prod.productoObj._id || prod.productoObj.id;
        if (idProducto) {
          const productoDB = await Product.findById(idProducto);
          if (productoDB && productoDB.stock && productoDB.stock[prod.talla] !== undefined) {
            productoDB.stock[prod.talla] = Number(productoDB.stock[prod.talla]) - Number(prod.cantidad);
            if (productoDB.stock[prod.talla] < 0) productoDB.stock[prod.talla] = 0;
            productoDB.markModified('stock');
            await productoDB.save();
          }
        }
      }
    }

    const nuevoApartado = new Apartado({ vendedor, cliente, cedula, telefono, productos, precioTotal, abono, faltante, imagen });
    const apartadoGuardado = await nuevoApartado.save();

    // 2. REGISTRAR ABONO
    const nuevoIngreso = new Ingreso({
      monto: abono,
      concepto: `Abono de ₡${abono} - Apartado Cliente: ${cliente}`,
      tipo: 'Abono Apartado',
      fecha: new Date(),
      vendedor: vendedor
    });
    await nuevoIngreso.save();

    res.status(201).json({ mensaje: 'Creado con éxito', apartado: apartadoGuardado });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al crear el apartado' });
  }
};

export const entregarApartado = async (req, res) => {
  try {
    const { id } = req.params;
    const apartado = await Apartado.findById(id);
    
    if (!apartado) return res.status(404).json({ error: 'Apartado no encontrado' });
    if (apartado.estado === 'ENTREGADO') return res.status(400).json({ error: 'Ya fue entregado' });

    apartado.estado = 'ENTREGADO';
    await apartado.save();

    if (apartado.faltante > 0) {
      const nuevoIngreso = new Ingreso({
        monto: apartado.faltante,
        concepto: `Cobro final de ₡${apartado.faltante} - Apartado Entregado a: ${apartado.cliente}`,
        tipo: 'Cancelación Apartado',
        fecha: new Date(),
        vendedor: apartado.vendedor
      });
      await nuevoIngreso.save();
    }

    const nuevaVenta = new Venta({
      cliente: apartado.cliente,
      vendedor: apartado.vendedor,
      productos: apartado.productos,
      totalGanancia: apartado.precioTotal, 
      metodoPago: 'Apartado',
      fecha: new Date()
    });
    await nuevaVenta.save();

    res.status(200).json({ mensaje: 'Entregado con éxito' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al entregar' });
  }
};

// 🚀 NUEVA FUNCIÓN: ELIMINAR TOTALMENTE
export const eliminarApartado = async (req, res) => {
  try {
    const { id } = req.params;
    const apartado = await Apartado.findById(id);

    if (!apartado) return res.status(404).json({ error: 'Apartado no encontrado' });

    // 1. DEVOLVER LAS CHEMAS AL STOCK
    for (const prod of apartado.productos) {
      if (prod.tipoPedido === 'stock' && prod.productoObj) {
        const idProducto = prod.productoObj._id || prod.productoObj.id;
        if (idProducto) {
          const productoDB = await Product.findById(idProducto);
          if (productoDB && productoDB.stock && productoDB.stock[prod.talla] !== undefined) {
            // Le sumamos la cantidad de vuelta
            productoDB.stock[prod.talla] = Number(productoDB.stock[prod.talla]) + Number(prod.cantidad);
            productoDB.markModified('stock');
            await productoDB.save();
          }
        }
      }
    }

    // 2. ELIMINAR EL INGRESO DEL ABONO
    // Busca el ingreso que coincida con el monto y que el concepto tenga el nombre del cliente
    await Ingreso.findOneAndDelete({ 
      monto: apartado.abono,
      tipo: 'Abono Apartado',
      concepto: new RegExp(apartado.cliente, 'i') 
    });

    // 3. ELIMINAR EL APARTADO DE LA BASE DE DATOS
    await Apartado.findByIdAndDelete(id);

    res.json({ mensaje: 'Apartado eliminado, stock devuelto e ingreso borrado exitosamente.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al eliminar el apartado' });
  }
};