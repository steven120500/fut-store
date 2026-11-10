// src/components/Contacto.jsx
import { FaFacebookF, FaInstagram, FaWhatsapp } from "react-icons/fa";
import { motion } from "framer-motion";

export const WHATSAPP_URL = "https://wa.me/50672327096";
export const INSTAGRAM_URL = "https://www.instagram.com/futstore.chemas/";
export const FACEBOOK_URL = "https://www.facebook.com/profile.php?id=61559013514708&locale=es_LA";

const redes = [
  { href: FACEBOOK_URL, label: "Facebook", Icon: FaFacebookF, hover: "group-hover:text-[#1877F2]" },
  { href: INSTAGRAM_URL, label: "Instagram", Icon: FaInstagram, hover: "group-hover:text-[#E1306C]" },
];

export default function Contacto() {
  return (
    <div className="flex w-full flex-col items-center gap-5 py-5">
      <motion.a
        href={WHATSAPP_URL}
        target="_blank"
        rel="noopener noreferrer"
        whileHover={{ y: -2 }}
        whileTap={{ scale: 0.97 }}
        className="flex w-full items-center justify-center gap-3 rounded-2xl bg-[#25D366] px-5 py-3.5 text-sm font-black uppercase tracking-wider text-white shadow-lg shadow-green-600/25 transition hover:bg-[#1ebe5a]"
      >
        <FaWhatsapp className="text-xl" /> Escríbenos por WhatsApp
      </motion.a>

      <div className="flex w-full items-center gap-3 text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-400">
        <span className="h-px flex-1 bg-zinc-200" /> Síguenos <span className="h-px flex-1 bg-zinc-200" />
      </div>

      <div className="flex justify-center gap-4">
        {redes.map(({ href, label, Icon, hover }) => (
          <motion.a
            key={label}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={label}
            whileHover={{ scale: 1.1, y: -2 }}
            whileTap={{ scale: 0.9 }}
            className="group grid h-12 w-12 place-items-center rounded-full border border-zinc-200 bg-silver shadow-md"
          >
            <Icon className={`text-xl text-zinc-800 transition-colors ${hover}`} />
          </motion.a>
        ))}
      </div>
    </div>
  );
}
