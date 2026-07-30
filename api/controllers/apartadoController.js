const Apartado = require('../models/Apartado');
const Ingreso = require('../models/Ingreso'); // Asumiendo que tienes un modelo para esto

exports.crearApartado = async (req, res) => {
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

    // Opcional: Aquí podrías descontar del inventario los productos que son tipo 'stock'

    res.status(201).json({ 
      mensaje: 'Apartado creado y abono registrado con éxito', 
      apartado: apartadoGuardado 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Hubo un error al crear el apartado' });
  }
};