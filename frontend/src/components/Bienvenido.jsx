import React, { useState, useEffect } from "react";
import CarruselFondo from "./CarruselFondo";

import fotofondo from "../assets/fotofondo.jpg";
import fotofondo1 from "../assets/fotofondo1.jpg";
import fotofondo2 from "../assets/fotofondo2.jpg";

// 🟢 Mensajes rotativos (sin huecos)
const mensajes = [
  "Bienvenido a FutStore",
  "Tienda física en Grecia",
  "Envíos a todo Costa Rica",
  "+2500 chemas en stock"
].filter(Boolean);

export default function Bienvenido() {
  const [index, setIndex] = useState(0);
  const [fade, setFade] = useState(true);
  const imagenes = [fotofondo, fotofondo1, fotofondo2];

  useEffect(() => {
    const interval = setInterval(() => {
      // 🔸 efecto de desvanecido
      setFade(false);
      setTimeout(() => {
        setIndex((prev) => (prev + 1) % mensajes.length);
        setFade(true);
      }, 500); // medio segundo de fade
    }, 4000); // ⏱️ cambia cada 4 segundos
    return () => clearInterval(interval);
  }, []);

  // 🔹 Función que emite el evento para mostrar ofertas
  const handleVerDescuentos = () => {
    window.dispatchEvent(new CustomEvent("filtrarOfertas"));
  };

  return (
    <section className="relative w-full h-screen flex flex-col items-center justify-center overflow-hidden text-center">
      {/* 🔹 Carrusel de fondo */}
      <CarruselFondo imagenes={imagenes} intervalo={2000} />

      {/* 🔸 Contenido encima del carrusel */}
      <div className="relative z-10 p-6 transition-all duration-1000">
        {/* 🟢 Mensaje principal rotativo con fade */}
        <h1
          className={`text-5xl sm:text-6xl font-bold text-vino-brillante drop-shadow-lg transition-opacity duration-700 ${
            fade ? "opacity-100" : "opacity-0"
          }`}
        >
          {mensajes[index]}
        </h1>

        {/* 🔸 Botón de descuentos */}
        <button
          onClick={handleVerDescuentos}
          className="mt-6 bg-red-600 hover:bg-red-700 text-white text-lg sm:text-xl font-semibold px-6 py-2 rounded-lg shadow-lg transition-transform hover:scale-105"
        >
          Ver Ofertas
        </button>

        {/* 🟡 Mensaje secundario (opcional, comentado) */}
        {/*
        <p className="text-sm sm:text-base text-white mt-3 whitespace-pre-line leading-snug drop-shadow-md">
          ¡Que el terror no sea el precio!{"\n"}
          10% de descuento en productos internacionales, 5% en nacionales{"\n"}
          ¡Este Halloween viste con estilo!
        </p>
        */}
      </div>
    </section>
  );
}
