// src/components/Bienvenido.jsx
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
  const [textoVisible, setTextoVisible] = useState(""); // texto animado
  const [fade, setFade] = useState(true);

  // Efecto máquina de escribir
  useEffect(() => {
    const [normal, destacado] = mensajes[index];
    const textoCompleto = normal + destacado;
    let i = 0;
    setTextoVisible("");

    const escribir = setInterval(() => {
      setTextoVisible(textoCompleto.slice(0, i));
      i++;
      if (i > textoCompleto.length) clearInterval(escribir);
    }, 80); // velocidad de escritura (ms por letra)

    return () => clearInterval(escribir);
  }, [index]);

  // Cambia mensaje cada 5s
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

  const handleVerDescuentos = () => {
    window.dispatchEvent(new CustomEvent("filtrarOfertas"));
  };

  return (
    <section className="relative w-full h-screen flex flex-col items-center justify-center overflow-hidden text-center">
      {/* 🔹 Fondo con carrusel */}
      <CarruselFondo imagenes={imagenes} intervalo={5000} />

      {/* 🔸 Contenedor del texto */}
      <div
        className={`relative z-10 px-6 py-3 transition-all duration-1000 ${
          fade ? "opacity-100" : "opacity-0"
        }`}
      >
        {/* 🟢 Fondo blanco con sombra sutil */}
        <div className="inline-block backdrop-blur-md rounded-lg px-8 py-4 shadow-xl ">
          <h1 className="text-4xl sm:text-6xl font-extrabold  text-blanco-borde-negro leading-snug tracking-tight typewriter">
            {textoVisible}
            
          </h1>



        </div>

        <div >
          
        </div>

        {/* 🔸 Botón */}
        <button
          onClick={handleVerDescuentos}
          className="mt-12 bg-red-600 hover:bg-red-700 text-white text-lg sm:text-xl font-semibold px-6 py-2 rounded-lg shadow-lg transition-transform hover:scale-105"
        >
          Ver Ofertas
        </button>
      </div>
    </section>
  );
}