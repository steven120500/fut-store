// src/components/Bienvenido.jsx
import React, { useState, useEffect } from "react";
import CarruselFondo from "./CarruselFondo";

// 🔹 Imágenes del fondo (ahora con más fotos)
const imagenes = [
  "/fotofondo.jpg",
  "/fotofondo1.jpg",
  "/fotofondo2.jpg",
  "/fotofondo3.jpg",
  "/fotofondo4.jpg",
  "/fotofondo5.jpg",
];

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
      <CarruselFondo imagenes={imagenes} intervalo={3000} />

      {/* 🔸 Contenido encima del carrusel */}
      <div className="relative z-10 p-6 transition-all duration-1000">
        {/* 🟢 Mensaje principal rotativo con fondo semitransparente */}
        <div
          className={`inline-block bg-black/40 backdrop-blur-sm px-6 py-3 rounded-md transition-opacity duration-700 ${
            fade ? "opacity-100" : "opacity-0"
          }`}
        >
          <h1
            className="text-4xl sm:text-6xl font-extrabold text-transparent bg-clip-text 
            bg-gradient-to-r from-white via-gray-200 to-gray-400 
            animate-gradient-slow drop-shadow-[0_3px_8px_rgba(0,0,0,0.6)]"
          >
            {mensajes[index]}
          </h1>
        </div>

        {/* 🔸 Botón de descuentos */}
        <button
          onClick={handleVerDescuentos}
          className="mt-6 bg-red-600 hover:bg-red-700 text-white text-lg sm:text-xl font-semibold px-6 py-2 rounded-lg shadow-lg transition-transform hover:scale-105"
        >
          Ver Ofertas
        </button>
      </div>
    </section>
  );
}