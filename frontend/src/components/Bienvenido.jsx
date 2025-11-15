import React from "react";


export default function Bienvenido() {
  const handleVerOfertas = () => {
    window.dispatchEvent(new CustomEvent("filtrarOfertas"));
  };


  const handleVerDisponibles = () => {
    window.dispatchEvent(new CustomEvent("filtrarDisponibles"));
  };


  return (
    <section className="relative sm:mt-48 sm:mb-0 mt-12 -mb-52 w-full h-screen flex flex-col items-center justify-center overflow-hidden text-center">


      {/* 🖼️ Fondo para PC */}
      <img
        src="/fotofondo1.jpg"
        alt="Fondo FutStore Desktop"
        className="hidden sm:block absolute inset-0 w-full h-full object-cover object-center brightness-[0.6] z-0"
      />


      {/* 🖼️ Fondo para CELULAR */}
      <img
        src="/fotofondomovil.jpg"
        alt="Fondo FutStore Móvil"
        className="block sm:hidden absolute inset-0  object-cover object-center brightness-[0.6] z-0"
      />


      {/* 🔹 Título */}
      <div className="relative z-10 px-6 py-3">
        <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold leading-snug tracking-tight text-center">
          {/* Aquí puedes poner un texto si querés */}
        </h1>


        {/* 🔘 Botones */}
        <div className="mt-10 flex flex-row justify-center items-center gap-3 w-full flex-wrap">
          <button
            onClick={handleVerDisponibles}
            className="boton-luminoso-verde bg-green-600 text-white 
                       text-sm sm:text-base md:text-lg font-semibold 
                       w-[160px] sm:w-[180px] md:w-[190px] 
                       px-6 py-3 sm:py-3 rounded-lg shadow-lg 
                       hover:scale-105 transition-all duration-300"
          >
            Ver disponible
          </button>


          <button
            onClick={handleVerOfertas}
            className="boton-luminoso-rojo bg-red-600 text-white 
                       text-sm sm:text-base md:text-lg font-semibold 
                       w-[160px] sm:w-[180px] md:w-[190px] 
                       px-6 py-3 sm:py-3 rounded-lg shadow-lg 
                       hover:scale-105 transition-all duration-300"
          >
           Ver Ofertas
          </button>
        </div>


      </div>
    </section>
  );
}
