import React, { useState, useEffect } from "react";
import CarruselFondo from "./CarruselFondo";

const imagenes = [
  "/fotofondo.jpg",
  "/fotofondo1.jpg",
  "/fotofondo2.jpg",
  "/fotofondo3.jpg",
  "/fotofondo4.jpg",
  "/fotofondo5.jpg",
];

// 🟢 Frases divididas en partes [normal, destacado]
const mensajes = [
  ["Bienvenido a ", "FutStore"],
  ["Tienda física en ", "Grecia"],
  ["Envíos a todo ", "Costa Rica"],
  ["+2500 ", "chemas en stock"],
];

export default function Bienvenido() {
  const [index, setIndex] = useState(0);
  const [textoVisible, setTextoVisible] = useState("");
  const [fade, setFade] = useState(true);

  // 🧠 efecto máquina de escribir
  useEffect(() => {
    const [normal, destacado] = mensajes[index];
    const textoCompleto = normal + destacado;
    let i = 0;
    setTextoVisible("");

    const escribir = setInterval(() => {
      setTextoVisible(textoCompleto.slice(0, i));
      i++;
      if (i > textoCompleto.length) clearInterval(escribir);
    }, 80);
    return () => clearInterval(escribir);
  }, [index]);

  // 🔁 cambia mensaje cada 5s
  useEffect(() => {
    const intervalo = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setIndex((prev) => (prev + 1) % mensajes.length);
        setFade(true);
      }, 300);
    }, 5000);
    return () => clearInterval(intervalo);
  }, []);

  // 🔹 Filtra los productos en oferta
  const handleVerOfertas = () => {
    window.dispatchEvent(new CustomEvent("filtrarOfertas"));
  };

  // 🟢 Muestra todos los productos disponibles con stock
  const handleVerDisponibles = () => {
    window.dispatchEvent(new CustomEvent("filtrarDisponibles"));
  };

  return (
    <section className="relative w-full h-screen flex flex-col items-center justify-center overflow-hidden text-center">
      {/* Fondo dinámico */}
      <CarruselFondo imagenes={imagenes} intervalo={5000} />

      {/* Contenedor del texto */}
      <div
        className={`relative z-10 px-6 py-3 transition-all duration-1000 ${
          fade ? "opacity-100" : "opacity-0"
        }`}
      >
        {/* 🟢 Fondo blanco translúcido detrás del texto */}
        <div className="inline-flex items-center justify-center backdrop-blur-md bg-white/20 rounded-lg px-8 py-4 shadow-xl min-w-[280px] sm:min-w-[420px] md:min-w-[520px] min-h-[100px] sm:min-h-[120px] md:min-h-[140px]">
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold text-blanco-borde-negro leading-snug tracking-tight text-center">
            {textoVisible}
          </h1>
        </div>

      {/* 🔘 Botones */}
<div className="mt-10 flex flex-row justify-center items-center gap-3 w-full">
  <button
    onClick={handleVerDisponibles}
    className="boton-luminoso-verde bg-green-600 text-white text-base sm:text-lg font-semibold w-[140px] sm:w-[180px] py-2 rounded-lg shadow-lg hover:scale-105 transition-all duration-300"
  >
    Ver disponible
  </button>

  <button
    onClick={handleVerOfertas}
    className="boton-luminoso-rojo bg-red-600 text-white text-base sm:text-lg font-semibold w-[140px] sm:w-[180px] py-2 rounded-lg shadow-lg hover:scale-105 transition-all duration-300"
  >
    Ver Ofertas
  </button>
</div>

      </div>
    </section>
  );
}
