// src/components/Medidas.jsx
import React, { useState } from "react";
import { LiaRulerSolid } from "react-icons/lia";
import ModalShell from "./ModalShell";
import fanImg from "../assets/Fan.png";
import playerImg from "../assets/Player.png";

const CATALOG = [
  { key: "Player", label: "Player", sub: "Corte ajustado", img: playerImg, desc: "Corte pegado al cuerpo, como lo usan los jugadores. Recomendamos pedir una talla más de la habitual." },
  { key: "Fan", label: "Fan", sub: "Corte estándar", img: fanImg, desc: "Corte recto y cómodo para el día a día. Pide tu talla habitual." },
];

export default function Medidas({ open, onClose, currentType }) {
  const [tab, setTab] = useState(String(currentType || "").toLowerCase() === "fan" ? "Fan" : "Player");
  if (!open) return null;
  const active = CATALOG.find((c) => c.key === tab) || CATALOG[0];

  return (
    <ModalShell
      onClose={onClose}
      title="Guía de tallas"
      subtitle="Revisa las medidas para tu ajuste perfecto"
      icon={LiaRulerSolid}
      size="lg"
      footer={
        <button onClick={onClose} className="fs-btn fs-btn-primary w-full">Entendido</button>
      }
    >
      {/* Selector de versión */}
      <div className="mb-4 grid grid-cols-2 gap-1 rounded-2xl bg-zinc-100 p-1">
        {CATALOG.map((c) => (
          <button
            key={c.key}
            type="button"
            onClick={() => setTab(c.key)}
            className={`rounded-xl px-3 py-2.5 text-left transition ${tab === c.key ? "bg-black text-white shadow-lg" : "bg-transparent text-zinc-600 hover:bg-white"}`}
          >
            <span className="block font-display text-lg uppercase leading-none tracking-wide">{c.label}</span>
            <span className={`block text-[10px] font-bold uppercase tracking-widest ${tab === c.key ? "text-cyan-300" : "text-zinc-400"}`}>{c.sub}</span>
          </button>
        ))}
      </div>

      <p className="mb-3 flex items-start gap-2 rounded-xl border border-cyan-200 bg-cyan-50 px-3 py-2.5 text-xs text-cyan-900">
        <span className="mt-1 h-1.5 w-1.5 shrink-0 rotate-45 bg-cyan-500" />
        {active.desc}
      </p>

      <div className="overflow-hidden rounded-2xl border border-zinc-100 bg-white p-2">
        <img src={active.img} alt={`Guía de medidas ${active.label}`} className="h-auto w-full object-contain" />
      </div>
    </ModalShell>
  );
}
