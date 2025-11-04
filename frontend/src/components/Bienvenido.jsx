import React from "react";

export default function Bienvenido() {
  const handleVerOfertas = () => {
    window.dispatchEvent(new CustomEvent("filtrarOfertas"));
  };

  const handleVerDisponibles = () => {
    window.dispatchEvent(new CustomEvent("filtrarDisponibles"));
  };

  return (
    <section className="relative w-full h-screen flex flex-col items-center justify-center overflow-hidden text-center">
      {/* 🖼️ Fondo fijo */}
      <img
        src="/fotofondo4.jpg"
        alt="Fondo FutStore"
        className="absolute inset-0 w-full h-full object-cover object-center brightness-[0.6] z-0"
      />

      {/* 🔹 Título */}
      <div className="relative z-10 px-6 py-3">
        <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold leading-snug tracking-tight text-center">
          <span className="text-white">Bienvenido a </span>
          <span className="text-plateado">FutStore</span>
        </h1>

        {/* 🔘 Botones */}
        <div className="mt-10 flex flex-row justify-center items-center gap-3 w-full">
          <button
            onClick={handleVerDisponibles}
            className="boton-luminoso-verde bg-green-600 text-white text-base sm:text-lg font-semibold w-[180px] sm:w-[180px] py-2 rounded-lg shadow-lg hover:scale-105 transition-all duration-300"
          >
            Ver disponible
          </button>

          <button
            onClick={handleVerOfertas}
            className="boton-luminoso-rojo bg-red-600 text-white text-base sm:text-lg font-semibold w-[180px] sm:w-[180px] py-2 rounded-lg shadow-lg hover:scale-105 transition-all duration-300"
          >
            Ver Ofertas
          </button>
        </div>
      </div>
    </section>
  );
}
