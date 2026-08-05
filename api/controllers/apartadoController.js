import Apartado from '../models/Apartado.js';
import Ingreso from '../models/Ingreso.js';
import Venta from '../models/Sale.js'; 
import Product from '../models/Product.js'; 

export const crearApartado = async (req, res) => {
  try {
    // 👈 AQUÍ AÑADIMOS imagen2, costoEnvio y direccionEnvio
    const { 
      vendedor, cliente, cedula, telefono, productos, 
      precioTotal, abono, faltante, imagen, imagen2, 
      costoEnvio, direccionEnvio 
    } = req.body;

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

    // 👈 AQUÍ LOS PASAMOS AL NUEVO APARTADO
    const nuevoApartado = new Apartado({ 
      vendedor, cliente, cedula, telefono, productos, 
      precioTotal, abono, faltante, imagen, imagen2, 
      costoEnvio, direccionEnvio 
    });
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

    // Cambiamos temporalmente a entregado
    apartado.estado = 'ENTREGADO';
    await apartado.save();

    try {
      // 1. REGISTRAR EL INGRESO FALTANTE
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

      // 2. CALCULAR RESUMEN EXACTO PARA LA VENTA
      const totalCantidad = apartado.productos.reduce((sum, p) => sum + (Number(p.cantidad) || 1), 0);
      const resumenChemas = apartado.productos.map(p => {
        const nombreItem = p.tipoPedido === 'stock' ? p.busqueda : p.descripcionManual;
        return `${p.cantidad}x ${nombreItem} (${p.talla})`;
      }).join(' + ');

      // 3. REGISTRAR LA VENTA CON LOS NOMBRES EXACTOS DE SALE.JS
      const nuevaVenta = new Venta({
        nombre: apartado.cliente,          
        cedula: apartado.cedula || 'N/A',
        numero: apartado.telefono || 'N/A',
        totalPago: apartado.precioTotal - (apartado.costoEnvio || 0), // Separamos el costo de prendas del envío
        costoEnvio: apartado.costoEnvio || 0,        // 👈 TRASLADAMOS EL ENVÍO
        direccionEnvio: apartado.direccionEnvio || '', // 👈 TRASLADAMOS LA DIRECCIÓN A LA VENTA
        montoTotal: apartado.precioTotal,  
        tallaVendida: apartado.productos[0]?.talla || 'L',
        cantidad: totalCantidad,
        productoNombre: resumenChemas,
        productos: apartado.productos,
        vendedor: apartado.vendedor,
        fecha: new Date()
      });
      await nuevaVenta.save();

      res.status(200).json({ mensaje: 'Entregado con éxito' });

    } catch (dbError) {
      // Si falla guardar la venta o el ingreso, revertimos el estado para que no quede pegado
      await Apartado.findByIdAndUpdate(id, { estado: 'PARA_ENTREGAR' });
      console.error("Error al registrar finanzas/venta:", dbError);
      throw dbError; // Mandar al catch principal
    }

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al entregar' });
  }
};

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
            productoDB.stock[prod.talla] = Number(productoDB.stock[prod.talla]) + Number(prod.cantidad);
            productoDB.markModified('stock');
            await productoDB.save();
          }
        }
      }
    }

    // 2. ELIMINAR EL INGRESO DEL ABONO
    await Ingreso.findOneAndDelete({ 
      monto: apartado.abono,
      tipo: 'Abono Apartado',
      concepto: new RegExp(apartado.cliente, 'i') 
    });

    // 3. ELIMINAR EL APARTADO DE LA BD
    await Apartado.findByIdAndDelete(id);

    res.json({ mensaje: 'Apartado eliminado exitosamente.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al eliminar el apartado' });
  }
};