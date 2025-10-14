import React, { useState, useEffect } from "react";
import ReactCountryFlag from "react-country-flag";

const mensajes = [
  "Bienvenido a FutStore",
  "Tienda física en Grecia",
  "Calidad exclusiva en el mercado",
  "+2500 chemas de entrega inmediata",
  <>
    Envíos a todo el país{" "}
    <ReactCountryFlag
      countryCode="CR"
      svg
      style={{ width: "1em", height: "1em" }}
    />
  </>,
];

export default function Bienvenido() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % mensajes.length);
    }, 3000); // ⏱️ cambia cada 3 segundos
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="text-center pt-48">
      {/* 🔹 Mensaje principal rotativo */}
      <h1 className="text-3xl sm:text-5xl font-bold text-yellow-600 transition-all duration-700">
        {mensajes[index]}
      </h1>

      {/* 🔸 Mensaje secundario fijo */}
      <p className="text-sm sm:text-base text-green-300 mt-2 whitespace-pre-line leading-snug">
      ¡Que el terror no sea el precio!{"\n"}
      10% de descuento en productos internacionales, 5% en productos nacionales{"\n"}
      ¡Este Halloween viste con estilo!
      </p>
    </div>
  );
}