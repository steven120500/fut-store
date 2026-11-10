import { cld } from "../utils/cloudinary";
// src/pages/PaymentResult.jsx
// Página a la que vuelve el cliente después de pagar con TiloPay.
// Estados: verificando → aprobado / rechazado / error al confirmar.
import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FaWhatsapp, FaArrowRight, FaRegCopy, FaCheck, FaEnvelopeOpenText, FaBoxOpen, FaTruck, FaRedo } from "react-icons/fa";
import { toast } from "react-toastify";
import { useCart } from "../context/CartContext";
import { API_ORIGIN } from "../config";
import { WHATSAPP_URL } from "../components/Contacto";
import logo from "../assets/logo.png";

const fmt = (n) => `₡${Number(n || 0).toLocaleString("de-DE")}`;

function readSnapshot() {
  try {
    return JSON.parse(sessionStorage.getItem("futstore:lastCheckout") || "null");
  } catch {
    return null;
  }
}

// ✔ / ✖ animados con trazo
function StatusMark({ ok }) {
  const color = ok ? "#22d3ee" : "#ef4444";
  return (
    <div className="relative mx-auto h-28 w-28">
      <motion.span
        className="absolute inset-0 rounded-full"
        style={{ background: `radial-gradient(circle, ${ok ? "rgba(34,211,238,0.35)" : "rgba(239,68,68,0.3)"}, transparent 70%)` }}
        animate={{ scale: [1, 1.25, 1], opacity: [0.8, 0.4, 0.8] }}
        transition={{ duration: 2.4, repeat: Infinity }}
      />
      <svg viewBox="0 0 100 100" className="relative h-full w-full">
        <motion.circle
          cx="50" cy="50" r="42" fill="none" stroke={color} strokeWidth="4" strokeLinecap="round"
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.7, ease: "easeOut" }}
        />
        {ok ? (
          <motion.path
            d="M31 52 L45 65 L70 38" fill="none" stroke={color} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"
            initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.45, delay: 0.6, ease: "easeOut" }}
          />
        ) : (
          <>
            <motion.path d="M36 36 L64 64" stroke={color} strokeWidth="6" strokeLinecap="round"
              initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.3, delay: 0.6 }} />
            <motion.path d="M64 36 L36 64" stroke={color} strokeWidth="6" strokeLinecap="round"
              initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.3, delay: 0.85 }} />
          </>
        )}
      </svg>
    </div>
  );
}

// Destellos de celebración (deterministas)
const SPARKS = Array.from({ length: 26 }, (_, i) => ({
  x: Math.cos((i / 26) * Math.PI * 2) * (140 + (i % 4) * 40),
  y: Math.sin((i / 26) * Math.PI * 2) * (110 + (i % 3) * 35),
  size: 4 + (i % 3) * 2,
  cyan: i % 2 === 0,
  delay: 0.7 + (i % 5) * 0.04,
}));

export default function PaymentResult() {
  const location = useLocation();
  const navigate = useNavigate();
  const { clearCart } = useCart();
  const params = useMemo(() => new URLSearchParams(location.search), [location.search]);

  const orderId = params.get("order") || "";
  const code = params.get("code") || params.get("Response") || params.get("response") || "";
  const description = params.get("description") || "";
  const approved = code === "1";

  const [status, setStatus] = useState(approved ? "verifying" : "rejected");
  const [summary, setSummary] = useState(() => readSnapshot());
  const [copied, setCopied] = useState(false);
  const ran = useRef(false);

  useEffect(() => {
    if (!orderId) {
      navigate("/", { replace: true });
      return;
    }
    if (!approved || ran.current) return;
    ran.current = true;

    (async () => {
      try {
        const res = await fetch(`${API_ORIGIN}/api/tilopay/confirm-payment`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId }),
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok && (data.success || data.status === "paid")) {
          if (data.order) setSummary((prev) => ({ ...prev, ...data.order, items: data.order.items?.length ? data.order.items : prev?.items }));
          clearCart();
          sessionStorage.removeItem("futstore:lastCheckout");
          setStatus("success");
          toast.success("¡Pago aprobado! Te enviamos la factura por correo.");
        } else {
          setStatus("error");
        }
      } catch {
        setStatus("error");
      }
    })();
  }, [orderId, approved, navigate, clearCart]);

  const copyOrder = async () => {
    try {
      await navigator.clipboard.writeText(orderId);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.info(`Tu número de pedido es ${orderId}`);
    }
  };

  const waText = encodeURIComponent(
    status === "success"
      ? `¡Hola FutStore! Acabo de pagar mi pedido ${orderId}.`
      : `¡Hola FutStore! Tuve un problema con el pago de mi pedido ${orderId}.`
  );

  const items = summary?.items || [];
  const total = summary?.total;
  const shipping = summary?.shipping || summary?.envio;

  return (
    <div className="relative min-h-[100svh] overflow-hidden bg-black text-white">
      {/* Fondo */}
      <picture className="pointer-events-none absolute inset-0">
        <source media="(min-width: 768px)" srcSet="/FondoD.jpg" />
        <img src="/FondoM.jpg" alt="" className="h-full w-full object-cover opacity-25" />
      </picture>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0.3),#000_75%)]" />

      {/* Barra superior */}
      <header className="relative z-10 mx-auto flex max-w-5xl items-center justify-between px-5 py-5">
        <button onClick={() => navigate("/")} className="flex items-center gap-3 border-0 bg-transparent p-0">
          <img src={logo} alt="FutStore" className="h-11 w-11 rounded-full ring-1 ring-white/20" />
          <span className="font-display text-2xl uppercase tracking-wider text-silver">FutStore</span>
        </button>
        <span className="hidden items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-white/40 sm:flex">
          <span className="h-1.5 w-1.5 rotate-45 bg-cyan-400" /> Pago seguro · TiloPay
        </span>
      </header>

      <main className="relative z-10 mx-auto flex max-w-xl flex-col items-center px-5 pb-16 pt-4 text-center sm:pt-10">
        {status === "verifying" && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center">
            <div className="relative mb-8 h-28 w-28">
              <span className="absolute inset-0 animate-spin rounded-full border-2 border-white/10 border-t-cyan-400 [animation-duration:1s]" />
              <span className="absolute inset-3 animate-spin rounded-full border-2 border-white/5 border-b-white/60 [animation-direction:reverse] [animation-duration:1.6s]" />
              <img src={logo} alt="" className="absolute inset-6 rounded-full" />
            </div>
            <h1 className="font-display text-4xl uppercase tracking-wide text-silver sm:text-5xl">Confirmando tu pago</h1>
            <p className="mt-3 text-sm text-white/60">Estamos validando la transacción con el banco. No cierres esta ventana.</p>
          </motion.div>
        )}

        {status !== "verifying" && (
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", stiffness: 90, damping: 16 }} className="relative w-full">
            {status === "success" && (
              <div className="pointer-events-none absolute left-1/2 top-14 h-0 w-0">
                {SPARKS.map((s, i) => (
                  <motion.span
                    key={i}
                    className="absolute rounded-full"
                    style={{ width: s.size, height: s.size, background: s.cyan ? "#22d3ee" : "#fff", boxShadow: s.cyan ? "0 0 10px #22d3ee" : "0 0 8px #fff" }}
                    initial={{ x: 0, y: 0, opacity: 0, scale: 0 }}
                    animate={{ x: s.x, y: s.y, opacity: [0, 1, 0], scale: [0, 1, 0.6] }}
                    transition={{ duration: 1.4, delay: s.delay, ease: "easeOut" }}
                  />
                ))}
              </div>
            )}

            <StatusMark ok={status === "success"} />

            <p className={`mt-6 text-[10px] font-bold uppercase tracking-[0.35em] ${status === "success" ? "text-cyan-300" : status === "error" ? "text-zinc-300" : "text-red-400"}`}>
              {status === "success" ? "Pago aprobado" : status === "error" ? "Pago recibido · en revisión" : "Pago no completado"}
            </p>
            <h1 className="mt-2 font-display text-4xl uppercase leading-[0.95] tracking-wide sm:text-6xl">
              {status === "success" && <>¡Gracias{summary?.firstName || summary?.nombre ? `, ${(summary.firstName || summary.nombre).split(" ")[0]}` : ""}!</>}
              {status === "error" && <>Estamos confirmando tu pedido</>}
              {status === "rejected" && <>El pago no se realizó</>}
            </h1>
            <p className="mx-auto mt-3 max-w-md text-sm text-white/60">
              {status === "success" && "Tu pedido está confirmado. Te enviamos la factura a tu correo y ya lo estamos preparando."}
              {status === "error" && "El banco nos devolvió tu pago, pero no pudimos terminar de registrarlo. Escríbenos con tu número de pedido y lo revisamos de inmediato."}
              {status === "rejected" && (description ? `${description}. ` : "") + "No se hizo ningún cobro. Puedes intentarlo de nuevo con otra tarjeta."}
            </p>

            {/* Número de pedido */}
            <button
              onClick={copyOrder}
              className="group mx-auto mt-6 flex items-center gap-3 rounded-full border border-white/15 bg-white/5 py-2 pl-4 pr-2 text-left backdrop-blur transition hover:border-cyan-400/60"
            >
              <span>
                <span className="block text-[9px] font-bold uppercase tracking-[0.25em] text-white/40">Pedido</span>
                <span className="block font-mono text-sm font-bold">{orderId}</span>
              </span>
              <span className="grid h-8 w-8 place-items-center rounded-full bg-white/10 text-white/70 group-hover:text-cyan-300">
                {copied ? <FaCheck size={11} /> : <FaRegCopy size={11} />}
              </span>
            </button>

            {/* Resumen */}
            {items.length > 0 && (
              <div className="mt-8 overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] text-left backdrop-blur-xl">
                <div className="flex items-center justify-between border-b border-white/10 px-5 py-3">
                  <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/50">Resumen</span>
                  <span className="text-[10px] font-bold text-white/40">{items.reduce((a, i) => a + (Number(i.quantity) || 1), 0)} artículos</span>
                </div>
                <ul className="divide-y divide-white/5">
                  {items.map((it, i) => (
                    <li key={i} className="flex items-center gap-3 px-5 py-3">
                      {it.image ? (
                        <img src={cld(it.image, "thumb")} alt="" className="h-12 w-10 shrink-0 rounded-lg object-cover" />
                      ) : (
                        <span className="h-12 w-10 shrink-0 rounded-lg bg-white/10" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-bold uppercase">{it.name}</p>
                        <p className="text-[11px] text-white/50">Talla {it.size} · x{it.quantity}</p>
                      </div>
                      <span className="text-sm font-bold">{fmt((Number(it.price) || 0) * (Number(it.quantity) || 1))}</span>
                    </li>
                  ))}
                </ul>
                <div className="space-y-1 border-t border-white/10 px-5 py-4 text-sm">
                  {shipping && (
                    <div className="flex justify-between text-white/60">
                      <span>{shipping.method || shipping.metodo || "Envío"}</span>
                      <span>{fmt(shipping.cost ?? shipping.precio)}</span>
                    </div>
                  )}
                  {total != null && (
                    <div className="flex items-end justify-between pt-1">
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50">{status === "success" ? "Total pagado" : "Total"}</span>
                      <span className="font-display text-3xl tracking-wide text-cyan-300">{fmt(total)}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Qué sigue */}
            {status === "success" && (
              <ol className="mt-6 grid grid-cols-3 gap-2 text-left">
                {[
                  { Icon: FaEnvelopeOpenText, t: "Factura", d: "En tu correo" },
                  { Icon: FaBoxOpen, t: "Preparación", d: "Empacamos tu pedido" },
                  { Icon: FaTruck, t: "Envío", d: "Te mandamos la guía" },
                ].map(({ Icon, t, d }, i) => (
                  <motion.li
                    key={t}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1 + i * 0.12 }}
                    className="rounded-2xl border border-white/10 bg-white/[0.03] p-3"
                  >
                    <span className="mb-2 grid h-8 w-8 place-items-center rounded-lg bg-cyan-400/10 text-cyan-300 ring-1 ring-cyan-400/30"><Icon size={13} /></span>
                    <p className="text-xs font-black uppercase">{t}</p>
                    <p className="text-[10px] text-white/50">{d}</p>
                  </motion.li>
                ))}
              </ol>
            )}

            {/* Acciones */}
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
              {status === "rejected" ? (
                <button onClick={() => navigate("/checkout")} className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-7 py-3.5 text-sm font-black uppercase tracking-[0.15em] text-black transition hover:scale-[1.03]">
                  <FaRedo size={12} /> Intentar de nuevo
                </button>
              ) : (
                <button onClick={() => navigate("/")} className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-7 py-3.5 text-sm font-black uppercase tracking-[0.15em] text-black transition hover:scale-[1.03]">
                  Seguir comprando <FaArrowRight size={12} />
                </button>
              )}
              <a
                href={`${WHATSAPP_URL}?text=${waText}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 px-7 py-3.5 text-sm font-bold uppercase tracking-[0.15em] text-white transition hover:border-white/50 hover:bg-white/5"
              >
                <FaWhatsapp className="text-[#25D366]" /> {status === "success" ? "Escríbenos" : "Ayuda por WhatsApp"}
              </a>
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
}
