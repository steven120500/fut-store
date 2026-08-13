// models/Product.js
import mongoose from "mongoose";

// ===== Tallas =====
const ADULT_SIZES = ["S", "M", "L", "XL", "XXL", "3XL", "4XL"];
const KID_SIZES = ["16", "18", "20", "22", "24", "26", "28"];
const BALL_SIZES = ["3", "4", "5"]; // ⚽ Tallas de balones
// 👟 NUEVO: Tallas de tacos combinadas (US / EU) - ¡CON COMAS!
const TACO_SIZES = ['7 US (40)', '7,5 US (40,5)', '8 US (41)', '8,5 US (42)', '9 US (42,5)', '9,5 US (43)', '10 US (44)', '10,5 US (44,5)', '11 US (45)', '11,5 US (45,5)', '12 US (46)'];

// 🔹 Unificamos todas las tallas válidas (INCLUYENDO TACOS)
const ALL_SIZES = new Set([...ADULT_SIZES, ...KID_SIZES, ...BALL_SIZES, ...TACO_SIZES]);

// ===== Validadores =====
const imageAnyValidator = {
  validator(v) {
    if (v == null) return true;
    if (typeof v !== "string") return false;

    const isData = /^data:image\/(png|jpe?g|webp|heic|heif);base64,/i.test(v);
    const isHttp = /^https?:\/\/\S+/i.test(v);

    return isData || isHttp;
  },
  message:
    "Imagen inválida: debe ser data URL base64 o una URL http(s).",
};

const stockValidator = {
  validator(obj) {
    if (!obj || typeof obj !== "object" || Array.isArray(obj)) return false;
    for (const [size, qty] of Object.entries(obj)) {
      if (!ALL_SIZES.has(String(size))) return false;
      const n = Number(qty);
      if (!Number.isFinite(n) || n < 0 || !Number.isInteger(n)) return false;
    }
    return true;
  },
  message:
    "Inventario inválido. Debe ser un objeto { talla: cantidad>=0 } con tallas válidas.",
};

// ===== Sub-esquema para imágenes =====
const ImageSchema = new mongoose.Schema(
  {
    public_id: { type: String, trim: true },
    url: { type: String, trim: true },
  },
  { _id: false }
);

// ===== Schema principal =====
const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 150 },
    price: { type: Number, required: true, min: 0 },

    // 👇 Precio de descuento opcional
    discountPrice: { type: Number, min: 0, default: null },

    imageSrc: {
      type: String,
      trim: true,
      maxlength: 600,
      validate: imageAnyValidator,
    },
    images: { type: [ImageSchema], default: [] },

    stock: { type: Object, required: true, validate: stockValidator },
    bodega: { type: Object, default: {} },

    // 🔹 Tipo de producto (Player, Fan, Mujer, Niño, Retro, Balón, Tacos, etc.)
    type: { type: String, required: true, trim: true, maxlength: 40 },

    // 👇 Campo adicional para mostrar etiqueta “NUEVO”
    isNew: { type: Boolean, default: false },

    // 🏆 NUEVO: Campo para identificar artículos del Mundial 2026
    isMundial: { type: Boolean, default: false },

    /* =========================
       🔒 CAMPOS PARA BLOQUEO (CANDADO)
       ========================= */
    lockedBy: { 
      type: String, 
      default: null 
    },
    lockedAt: { 
      type: Date, 
      default: null 
    }
  },
  { timestamps: true }
);

// ===== Hooks =====
productSchema.pre("validate", function (next) {
  // 🔹 Normalizamos precio
  if (typeof this.price === "number" && Number.isFinite(this.price)) {
    this.price = Math.trunc(this.price);
  }

  // 👇 Si discountPrice está vacío, lo dejamos en null en vez de 0
  if (this.discountPrice == null || this.discountPrice === "") {
    this.discountPrice = null;
  } else if (
    typeof this.discountPrice === "number" &&
    Number.isFinite(this.discountPrice)
  ) {
    this.discountPrice = Math.trunc(this.discountPrice);
    if (this.discountPrice <= 0) this.discountPrice = null; // evita guardar 0
  }

  // ✅ Si es un balón y el stock está vacío, se rellenan las tallas por defecto
  if (
    this.type &&
    ["balón", "balon"].includes(this.type.toLowerCase()) &&
    (!this.stock || Object.keys(this.stock).length === 0)
  ) {
    this.stock = { "3": 0, "4": 0, "5": 0 };
  }

  // 👟 Si son Tacos y el stock está vacío, se rellenan las tallas por defecto (CON COMAS)
  if (
    this.type &&
    this.type.toLowerCase() === "tacos" &&
    (!this.stock || Object.keys(this.stock).length === 0)
  ) {
    this.stock = {
      '7 US (40)': 0, '7,5 US (40,5)': 0, '8 US (41)': 0, '8,5 US (42)': 0,
      '9 US (42,5)': 0, '9,5 US (43)': 0, '10 US (44)': 0, '10,5 US (44,5)': 0,
      '11 US (45)': 0, '11,5 US (45,5)': 0, '12 US (46)': 0
    };
  }

  next();
});

// ===== Índices =====
productSchema.index({ createdAt: -1 });
productSchema.index({ name: 1 });
productSchema.index({ type: 1 });
productSchema.index({ price: 1, createdAt: -1 });
productSchema.index({ discountPrice: 1 });
productSchema.index({ isNew: 1 });
productSchema.index({ isMundial: 1 });

// ===== Limpieza de salida =====
productSchema.set("toJSON", {
  virtuals: false,
  versionKey: false,
  transform: (_doc, ret) => {
    ret.id = String(ret._id);
    delete ret._id;
    return ret;
  },
});

productSchema.set("toObject", { virtuals: false, versionKey: false });
productSchema.set("minimize", true);
productSchema.set("strictQuery", true);

export default mongoose.model("Product", productSchema);