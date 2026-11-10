import React from "react";
import { motion } from "framer-motion";
import useMarquee from "../hooks/useMarquee";

const MESSAGES = [
  "Stock de +6000 chemas",
  "Envíos a todo el país",
  "Somos FutStore",
  "Tu estilo juega en primera",
];

// Franja plateada con mensajes en marquesina (se renderiza dentro del Header)
export default function TopBanner() {
  const items = [...MESSAGES, ...MESSAGES, ...MESSAGES, ...MESSAGES];
  const { trackRef, x, handlers } = useMarquee(40);

  return (
    <div
      className="bg-silver relative flex w-full items-center overflow-hidden border-y border-black/10 text-black"
      style={{ height: "var(--banner-h)" }}
      aria-label={MESSAGES.join(" · ")}
    >
      <motion.div ref={trackRef} style={{ x }} {...handlers} className="flex w-max items-center will-change-transform" aria-hidden="true">
        {[0, 1].map((dup) => (
          <div key={dup} className="flex shrink-0 items-center">
            {items.map((msg, i) => (
              <span key={`${dup}-${i}`} className="flex items-center whitespace-nowrap px-5 text-[10px] font-extrabold uppercase tracking-[0.25em] sm:text-[11px]">
                {msg}
                <span className="ml-10 inline-block h-1 w-1 rotate-45 bg-cyan-500" />
              </span>
            ))}
          </div>
        ))}
      </motion.div>
    </div>
  );
}
