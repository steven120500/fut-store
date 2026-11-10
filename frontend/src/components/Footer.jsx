import { useRef } from "react";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import { FaFacebookF, FaInstagram, FaWhatsapp, FaArrowRight } from "react-icons/fa";
import logo from "../assets/logo.png";
import { WHATSAPP_URL, INSTAGRAM_URL, FACEBOOK_URL } from "./Contacto";

const categorias = [
  { label: "Player", event: "filtrarPlayer" },
  { label: "Fan", event: "filtrarFan" },
  { label: "Retro", event: "filtrarRetros" },
  { label: "Nacional", event: "filtrarNacional" },
  { label: "Tacos", event: "filtrarTacos" },
  { label: "Ofertas", event: "filtrarOfertas" },
];

const redes = [
  { href: INSTAGRAM_URL, Icon: FaInstagram, label: "Instagram" },
  { href: FACEBOOK_URL, Icon: FaFacebookF, label: "Facebook" },
  { href: WHATSAPP_URL, Icon: FaWhatsapp, label: "WhatsApp" },
];

// 🪙 Logo como moneda 3D con canto
function LogoCoin({ size = 96 }) {
  const edge = Array.from({ length: 8 });
  return (
    <div style={{ width: size, height: size, perspective: 800 }}>
      <div className="coin-spin relative h-full w-full">
        {edge.map((_, i) => (
          <div
            key={i}
            className="absolute inset-0 rounded-full bg-gradient-to-b from-zinc-300 to-zinc-600"
            style={{ transform: `translateZ(${-i - 1}px)` }}
          />
        ))}
        <img src={logo} alt="FutStore" className="absolute inset-0 h-full w-full rounded-full [backface-visibility:hidden]" style={{ transform: "translateZ(0.5px)" }} />
        <img src={logo} alt="" className="absolute inset-0 h-full w-full rounded-full [backface-visibility:hidden]" style={{ transform: "translateZ(-9.5px) rotateY(180deg)" }} />
      </div>
    </div>
  );
}

export default function Footer() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end end"] });
  const progress = useSpring(scrollYProgress, { stiffness: 70, damping: 20 });

  // La palabra gigante se levanta desde el piso al llegar al footer
  const wordRotate = useTransform(progress, [0.15, 0.85], [78, 0]);
  const wordY = useTransform(progress, [0.15, 0.85], [120, 0]);
  const wordOpacity = useTransform(progress, [0.1, 0.5], [0, 1]);
  const wordScale = useTransform(progress, [0.15, 0.85], [0.85, 1]);
  const year = new Date().getFullYear();

  const goCategory = (event) => {
    if (window.location.pathname !== "/") {
      window.location.assign("/");
      return;
    }
    window.dispatchEvent(new CustomEvent(event));
  };

  return (
    <footer ref={ref} className="relative z-10 mt-20 overflow-hidden bg-black text-white">
      {/* Línea superior brillante */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/70 to-transparent" />

      {/* 🟩 Piso de cancha 3D en movimiento */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[70%]" style={{ perspective: 600, perspectiveOrigin: "50% 0%" }}>
        <div
          className="pitch-plane absolute left-[-50%] top-0 h-[220%] w-[200%] origin-top [mask-image:linear-gradient(to_bottom,transparent,black_35%,black_70%,transparent)]"
          style={{ transform: "rotateX(72deg)" }}
        />
      </div>
      <div className="pointer-events-none absolute left-1/2 top-1/3 h-[500px] w-[900px] -translate-x-1/2 rounded-full bg-cyan-400/[0.07] blur-[120px]" />

      {/* 📣 CTA */}
      <div className="relative mx-auto flex max-w-7xl flex-col items-center px-5 pt-16 text-center sm:px-8 sm:pt-20">
        <motion.div
          initial={{ opacity: 0, y: 30, rotateX: -40 }}
          whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ type: "spring", stiffness: 80, damping: 14 }}
          className="mb-6"
        >
          <LogoCoin size={88} />
        </motion.div>

        <motion.p
          initial={{ opacity: 0, letterSpacing: "0.1em" }}
          whileInView={{ opacity: 1, letterSpacing: "0.4em" }}
          viewport={{ once: true }}
          transition={{ duration: 1 }}
          className="mb-3 text-[10px] font-bold uppercase text-cyan-300/90 sm:text-xs"
        >
          ¿Listo para saltar a la cancha?
        </motion.p>
        <motion.h3
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="max-w-3xl font-display text-4xl uppercase leading-[0.95] tracking-wide sm:text-6xl"
        >
          Tu próxima camiseta <span className="text-silver">te está esperando</span>
        </motion.h3>

        <motion.a
          href={WHATSAPP_URL}
          target="_blank"
          rel="noopener noreferrer"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.25 }}
          className="group mt-8 inline-flex items-center gap-3 rounded-full bg-white px-7 py-4 text-sm font-black uppercase tracking-[0.18em] text-black shadow-[0_15px_50px_rgba(255,255,255,0.18)] transition hover:scale-[1.04]"
        >
          <FaWhatsapp className="text-xl text-[#25D366]" /> Escríbenos ahora
          <FaArrowRight className="transition group-hover:translate-x-1" />
        </motion.a>
      </div>

      {/* 🔠 Palabra gigante 3D que se levanta del piso */}
      <div className="relative mt-14 flex justify-center overflow-hidden px-2" style={{ perspective: 900 }}>
        <motion.h2
          style={{ rotateX: wordRotate, y: wordY, opacity: wordOpacity, scale: wordScale, transformOrigin: "50% 100%" }}
          className="select-none whitespace-nowrap bg-gradient-to-b from-white via-zinc-200 to-zinc-500 bg-clip-text font-display uppercase leading-[0.85] text-transparent text-3d-silver [mask-image:linear-gradient(to_bottom,black_55%,transparent_100%)]"
          aria-hidden
        >
          <span style={{ fontSize: "clamp(4.5rem, 21vw, 22rem)" }}>FutStore</span>
        </motion.h2>
      </div>

      {/* 🔗 Panel de enlaces */}
      <div className="relative mx-auto mt-6 max-w-7xl px-5 sm:mt-10 sm:px-8">
        <div className="grid grid-cols-1 gap-8 rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl sm:p-8 md:grid-cols-3">
          <div>
            <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.3em] text-cyan-300/70">FutStore Costa Rica</p>
            <p className="max-w-xs text-sm text-white/60">La élite del fútbol, en tu piel. Más de 6000 camisas en stock y envíos a todo el país.</p>
          </div>

          <div>
            <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.3em] text-cyan-300/70">Categorías</p>
            <div className="flex flex-wrap gap-2">
              {categorias.map((c) => (
                <button
                  key={c.label}
                  onClick={() => goCategory(c.event)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                    c.label === "Ofertas"
                      ? "border-red-500/40 bg-red-600/15 text-red-300 hover:bg-red-600 hover:text-white"
                      : "border-white/10 bg-white/5 text-white/70 hover:border-white/40 hover:text-white"
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.3em] text-cyan-300/70">Síguenos</p>
            <div className="flex gap-3">
              {redes.map(({ href, Icon, label }) => (
                <motion.a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  whileHover={{ rotateY: 180, scale: 1.1 }}
                  transition={{ duration: 0.5 }}
                  className="grid h-11 w-11 place-items-center rounded-full border border-white/15 bg-white/5 text-white/80 hover:border-cyan-300 hover:text-cyan-300"
                >
                  <Icon />
                </motion.a>
              ))}
            </div>
            <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="mt-4 inline-block text-sm text-white/60 transition hover:text-white">
              +506 7232-7096
            </a>
          </div>
        </div>
      </div>

      <div className="relative mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-5 py-6 text-xs text-white/40 sm:flex-row sm:px-8">
        <p>© {year} FutStore. Todos los derechos reservados.</p>
        <p>
          Diseñado por{" "}
          <a href="https://wa.me/50688028216" target="_blank" rel="noopener noreferrer" className="font-bold text-white/70 underline-offset-4 hover:text-white hover:underline">
            Beesoft
          </a>
        </p>
      </div>
    </footer>
  );
}
