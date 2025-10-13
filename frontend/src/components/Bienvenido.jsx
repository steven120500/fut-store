import React, { useState, useEffect } from "react";
import ReactCountryFlag from "react-country-flag";

const mensajes = [
  "Bienvenido a FutStore",
  "Tienda física en Grecia",
  "Calidad exclusiva en el mercado",
  "+2500 chemas de entrega inmediata",
  <>
    Envíos a todo el país{" "}
    <ReactCountryFlag countryCode="CR" svg style={{ width: "1em", height: "1em" }} />
  </>,
];

export default function Bienvenido() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % mensajes.length);
    }, 3000); // ⏱️ cada 3 segundos cambia el mensaje

    return () => clearInterval(interval);
  }, []);

  return (
    <h1 className="text-3xl sm:text-5xl font-bold pt-48 text-center text-yellow-600 transition-all duration-700">
      {mensajes[index]}
    </h1>
  );
}