const mongoose = require('mongoose');

const productoSchema = new mongoose.Schema({
    equipo: { type: String, required: true },
    jugador: { type: String, required: true },
    temporada: Number,
    color: String,
    talla: String,
    cantidad: { type: Number, default: 1 },
    precio: { type: Number, required: true },
    tipo: String
}, { timestamps: true });

module.exports = mongoose.model('Producto', productoSchema);