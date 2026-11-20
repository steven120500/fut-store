// ⚠️ Este archivo está duplicado en api/utils/vendedores.js — si cambias uno, cambia el otro.
//
// Lista única de vendedores. `nombre` es el nombre oficial (el que se guarda y sale en el ranking).
// `alias`: nombres o apodos que también cuentan como esa persona (en minúscula y sin tildes).
//   - Coinciden si son el nombre completo escrito o la primera palabra ("Justin", "Bulo Lobo").
// `apodos`: palabras tan únicas que cuentan aunque estén en cualquier parte del nombre.
export const VENDEDORES = [
  { nombre: 'Justin Lobo', alias: ['justin', 'bulo'], apodos: ['bulo'] },
  { nombre: 'Bety', alias: ['bety', 'alonso', 'alonso lobo'], apodos: ['bety', 'alonso'] },
  { nombre: 'Ashley Rosales', alias: ['ashley'] },
  { nombre: 'Steven Corrales', alias: ['steven'] },
];

export const NOMBRES_VENDEDORES = VENDEDORES.map((v) => v.nombre);

const clave = (s) =>
  String(s ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();

const tituloCase = (s) =>
  String(s).trim().replace(/\s+/g, ' ').toLowerCase().replace(/(^|\s)\S/g, (l) => l.toUpperCase());

// Devuelve el vendedor oficial que corresponde a `nombre`, o null si no es ninguno.
export const vendedorOficial = (nombre) => {
  const k = clave(nombre);
  if (!k) return null;
  const palabras = k.split(' ');

  const exacto = VENDEDORES.find((v) => clave(v.nombre) === k || v.alias.includes(k));
  if (exacto) return exacto.nombre;

  const porPrimera = VENDEDORES.find((v) => v.alias.includes(palabras[0]));
  if (porPrimera) return porPrimera.nombre;

  const porApodo = VENDEDORES.find((v) => (v.apodos || []).some((a) => palabras.includes(a)));
  return porApodo ? porApodo.nombre : null;
};

// Nombre estandarizado para guardar/agrupar: el oficial si lo es, si no el mismo nombre en Título.
export const normalizarVendedor = (nombre) => {
  if (!clave(nombre)) return '';
  return vendedorOficial(nombre) || tituloCase(nombre);
};

export const mismoVendedor = (a, b) => {
  const na = normalizarVendedor(a);
  return !!na && na === normalizarVendedor(b);
};

// Vendedor que corresponde al usuario logueado (nombre completo primero, luego primer nombre/usuario)
export const vendedorDeUsuario = (user, fallback = 'Steven Corrales') => {
  const completo = [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim();
  return (
    vendedorOficial(completo) ||
    vendedorOficial(user?.firstName) ||
    vendedorOficial(user?.username) ||
    (completo ? tituloCase(completo) : '') ||
    user?.username ||
    fallback
  );
};
