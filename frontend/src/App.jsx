import React, { useEffect, useRef, useState } from "react";
import { BrowserRouter as Router, Routes, Route, useSearchParams, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";

// --- IMPORTACIONES DEL CARRITO ---
import { CartProvider } from "./context/CartContext";
import CartDrawer from "./components/CartDrawer"; 

// Componentes
import Header from "./components/Header";
import ProductCard from "./components/ProductCard";
import AddProductModal from "./components/AddProductModal";
import LoginModal from "./components/LoginModal";
import RegisterUserModal from "./components/RegisterUserModal";
import Footer from "./components/Footer";
import InicioOverlay from "./components/InicioOverlay"; 
import UserListModal from "./components/UserListModal";
import Medidas from "./components/Medidas";
import Bienvenido from "./components/Bienvenido";
import CatalogHeader from "./components/CatalogHeader"; 
import FilterBar from "./components/FilterBar";
import LoadingOverlay from "./components/LoadingOverlay"; 
import ProtectedRoute from "./components/ProtectedRoute"; 
import tallaPorTipo from "./utils/tallaPorTipo";
import { FaPlus, FaChevronLeft, FaChevronRight, FaArrowRight } from "react-icons/fa";
import { toast } from "react-toastify";
import FutToaster from "./components/FutToaster";
import WhatsAppFloat from "./components/WhatsAppFloat";
import "react-toastify/dist/ReactToastify.css";
import "./index.css";
import { AUTH_EXPIRED_EVENT } from "./authFetch";

// Páginas
import ResetPassword from "./pages/ResetPassword";
import ProductDetail from "./pages/ProductDetail.jsx";
import Checkout from "./pages/Checkout.jsx"; 
import PaymentResult from "./pages/PaymentResult.jsx";
import OrdersPage from "./pages/OrdersPage.jsx"; 
import HistoryPage from "./pages/HistoryPage.jsx"; 
import SalesPage from "./pages/SalesPage.jsx"; 
import DailyReportPage from "./pages/DailyReportPage.jsx"; 
import BalancePage from "./pages/BalancePage.jsx";
import ApartadosPage from './pages/ApartadosPage';

const API_BASE = "https://fut-store.onrender.com"; 

function buildPages(page, pages) {
  const out = new Set([1, pages, page, page - 1, page - 2, page + 1, page + 2]);
  return [...out].filter((n) => n >= 1 && n <= pages).sort((a, b) => a - b);
}

const getPid = (p) => String(p?._id ?? p?.id ?? "");

// 🔥 COMPONENTE SKELETON PARA TARJETAS DE PRODUCTO
function ProductSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-zinc-100 bg-white">
      <div className="relative w-full overflow-hidden bg-zinc-100" style={{ aspectRatio: "4/5" }}>
        <div className="absolute inset-0 animate-[shimmer_1.4s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent" />
      </div>
      <div className="space-y-2 p-3 sm:p-4">
        <div className="h-3.5 w-4/5 rounded bg-zinc-200" />
        <div className="h-3.5 w-1/2 rounded bg-zinc-100" />
        <div className="h-5 w-1/3 rounded bg-zinc-200 pt-2" />
      </div>
    </div>
  );
}

// 🔥 COMPONENTE DE TIRA POR CATEGORÍA CON FETCH PROPIO Y RESPALDO LOCAL
function CategoryRow({ title, categoryKey, products, onSelectCategory, canEdit, user }) {
  const [rowProducts, setRowProducts] = useState([]);
  const [loadingRow, setLoadingRow] = useState(true);

  const normalize = (str) => str?.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

  useEffect(() => {
    let isMounted = true;
    setLoadingRow(true);

    const query = categoryKey === "Ofertas"
      ? `limit=100`
      : `type=${encodeURIComponent(categoryKey)}&limit=10`;

    fetch(`${API_BASE}/api/products?${query}`)
      .then((r) => (r.ok ? r.json() : { items: [] }))
      .then((data) => {
        if (!isMounted) return;
        let items = data.items || [];

        if (categoryKey === "Ofertas") {
          items = items.filter((p) => {
            const price = Number(p.price ?? 0);
            const dp = Number(p.discountPrice ?? 0);
            return dp > 0 && dp < price;
          });
        }

        items.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        setRowProducts(items.slice(0, 5));
      })
      .catch(() => {
        if (isMounted) setRowProducts([]);
      })
      .finally(() => {
        if (isMounted) setLoadingRow(false);
      });

    return () => {
      isMounted = false;
    };
  }, [categoryKey]);

  // Respaldo con los productos generales por si aún están cargando o se editaron en vivo
  const fallbackItems = products.filter((product) => {
    const productType = normalize(product.type || "");
    const productName = normalize(product.name || "");
    const target = normalize(categoryKey);

    if (categoryKey === "Ofertas") {
      const price = Number(product.price ?? 0);
      const dp = Number(product.discountPrice ?? 0);
      return dp > 0 && dp < price;
    }
    return productType.includes(target) || productName.includes(target);
  }).slice(0, 5);

  const displayItems = rowProducts.length >= fallbackItems.length ? rowProducts : fallbackItems;

  if (!loadingRow && displayItems.length === 0) return null;

  const cardWrap = "w-[46vw] max-w-[230px] shrink-0 snap-start sm:w-[38vw] md:w-auto md:max-w-none";

  return (
    <section className="mx-auto mb-14 w-full max-w-[1600px] sm:mb-16">
      <div className="mb-5 flex items-end justify-between gap-4 px-4 sm:px-8">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-cyan-600">Colección</p>
          <h2 className="font-display text-3xl uppercase leading-none tracking-wide text-black sm:text-4xl">{title}</h2>
        </div>

        <button
          onClick={() => onSelectCategory(categoryKey)}
          className="group flex shrink-0 items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 py-2 text-[11px] font-black uppercase tracking-widest text-black transition hover:border-black hover:bg-black hover:text-cyan-300"
        >
          Ver todo
          <FaArrowRight size={10} className="transition group-hover:translate-x-0.5" />
        </button>
      </div>

      <div className="no-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-4 px-4 pb-2 sm:gap-4 sm:px-8 md:grid md:grid-cols-4 md:overflow-visible md:pb-0 lg:grid-cols-5">
        {loadingRow && displayItems.length === 0
          ? Array.from({ length: 5 }).map((_, idx) => (
              <div key={`row-skel-${categoryKey}-${idx}`} className={`${cardWrap} ${idx === 4 ? "md:hidden lg:block" : ""}`}>
                <ProductSkeleton />
              </div>
            ))
          : displayItems.map((product, idx) => (
              <div key={getPid(product)} className={`${cardWrap} ${idx === 4 ? "md:hidden lg:block" : ""}`}>
                <ProductCard
                  canEdit={canEdit}
                  product={product}
                  user={user}
                  onClick={() => window.location.assign(`/product/${getPid(product)}`)}
                />
              </div>
            ))}
      </div>
    </section>
  );
}

function MainApp() {
  const [products, setProducts] = useState([]);

  const [loading, setLoading] = useState(() => {
    return sessionStorage.getItem("introMundial") ? false : true;
  });

  const [startedWithIntro] = useState(loading);
  const [isFiltering, setIsFiltering] = useState(false); 
  const [isFetchingProducts, setIsFetchingProducts] = useState(true);

  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();

  const [searchTerm, setSearchTerm] = useState(searchParams.get("q") || "");
  const [filterType, setFilterType] = useState(searchParams.get("type") || "");
  const [filterSizes, setFilterSizes] = useState(
    searchParams.get("sizes") ? searchParams.get("sizes").split(",") : []
  );

  const [pendingScroll, setPendingScroll] = useState(() => {
    return !!(searchParams.get("q") || searchParams.get("type") || searchParams.get("sizes"));
  });

  // Estados de Modales
  const [showAddModal, setShowAddModal] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showRegisterUserModal, setShowRegisterUserModal] = useState(false);
  const [showUserListModal, setShowUserListModal] = useState(false);
  const [showMedidas, setShowMedidas] = useState(false);

  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [total, setTotal] = useState(0);

  const isFrontendFilterActive = filterType === "Mundial" || filterSizes.length > 0;

  const pages = isFrontendFilterActive
    ? 1
    : Math.max(1, Math.ceil(total / limit));

  const pageTopRef = useRef(null);
  const isFirstRun = useRef(true);

  // Sincronizar la URL cada vez que cambia un filtro
  useEffect(() => {
    if (location.pathname === "/") {
      const params = new URLSearchParams();
      if (searchTerm) params.set("q", searchTerm);
      if (filterType) params.set("type", filterType);
      if (filterSizes && filterSizes.length > 0) params.set("sizes", filterSizes.join(","));
      setSearchParams(params, { replace: true });
    }
  }, [searchTerm, filterType, filterSizes, location.pathname, setSearchParams]);

  useEffect(() => {
    const handleFilterEvent = (e) => {
      const typeMap = {
        filtrarRetros: "Retro",
        filtrarPlayer: "Player",
        filtrarFan: "Fan",
        filtrarNacional: "Nacional",
        filtrarOfertas: "Ofertas",
        filtrarMundial: "Mundial", 
        filtrarTacos: "Tacos",
        filtrarNuevos: "Nuevos"
      };

      const newFilter = typeMap[e.type];
      if (newFilter) {
        setFilterType(newFilter);
        setPage(1); 

        const catalogo = document.getElementById("catalogo-top");
        if (catalogo) {
          const rect = catalogo.getBoundingClientRect();
          const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
          window.scrollTo({ top: rect.top + scrollTop - 100, behavior: "smooth" });
        }
      }
    };

    const events = ["filtrarRetros", "filtrarPlayer", "filtrarFan", "filtrarNacional", "filtrarOfertas", "filtrarMundial", "filtrarTacos", "filtrarNuevos"];
    events.forEach(ev => window.addEventListener(ev, handleFilterEvent));

    return () => {
      events.forEach(ev => window.removeEventListener(ev, handleFilterEvent));
    };
  }, []);

  const [user, setUser] = useState(() => {
    try {
      const storedUser = localStorage.getItem("user");
      const parsed = storedUser ? JSON.parse(storedUser) : null;
      // Sesiones antiguas sin token ya no sirven: el backend ahora exige token
      if (parsed && !parsed.token) {
        localStorage.removeItem("user");
        return null;
      }
      return parsed;
    } catch { return null; }
  });

  const isSuperUser = user?.isSuperUser || false;
  const canSeeHistory = user?.isSuperUser || user?.roles?.includes("history");
  const canAdd = user?.isSuperUser || user?.roles?.includes("add");
  const canEdit = user?.isSuperUser || user?.roles?.includes("edit");

  // Sesión vencida o revocada → cerrar sesión limpiamente
  useEffect(() => {
    const onExpired = () => {
      setUser(null);
      toast.info("Tu sesión expiró. Inicia sesión de nuevo.");
    };
    window.addEventListener(AUTH_EXPIRED_EVENT, onExpired);
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, onExpired);
  }, []);

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("user");
    toast.success("Sesión cerrada correctamente");
  };

  const fetchProducts = async (opts = {}) => {
    if (loading) return;

    const p = opts.page ?? page;
    const q = (opts.q ?? searchTerm).trim();
    const currentActualFilter = (opts.type ?? filterType).trim();
    const tp = (currentActualFilter === "Mundial" || currentActualFilter === "Nuevos") ? "" : currentActualFilter;
    const currentSizes = opts.sizes ?? filterSizes; 
    const mode = opts.mode ?? (window.__verDisponiblesActivo ? "disponibles" : "");

    const needsMassiveFetch = currentActualFilter === "Mundial" || currentSizes.length > 0;

    setIsFetchingProducts(true);
    if (needsMassiveFetch) setIsFiltering(true); 

    try {
      const baseParams = {
        limit: needsMassiveFetch ? "100" : "20",
        ...(q ? { q } : {}),
        ...(tp ? { type: tp } : {}),
        ...(mode ? { mode } : {}),
      };

      const params = new URLSearchParams({
        page: needsMassiveFetch ? "1" : String(p),
        ...baseParams
      });

      const res = await fetch(`${API_BASE}/api/products?${params.toString()}`);
      if (!res.ok) throw new Error("HTTP " + res.status);
      const json = await res.json();

      let fetchedItems = json.items || [];
      let fetchedTotal = json.total || 0;

      if (needsMassiveFetch && fetchedItems.length > 0 && fetchedItems.length < fetchedTotal) {
        const limitUsed = fetchedItems.length; 
        const totalPagesToFetch = Math.ceil(fetchedTotal / limitUsed);

        const fetchPromises = [];
        const maxPages = Math.min(totalPagesToFetch, 50); 

        for (let i = 2; i <= maxPages; i++) {
          const loopParams = new URLSearchParams({ page: String(i), ...baseParams });
          fetchPromises.push(
            fetch(`${API_BASE}/api/products?${loopParams.toString()}`)
              .then(r => r.ok ? r.json() : { items: [] })
              .catch(() => ({ items: [] }))
          );
        }

        const results = await Promise.all(fetchPromises);
        results.forEach(result => {
          if (result.items) fetchedItems = [...fetchedItems, ...result.items];
        });
      }

      fetchedItems.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

      setProducts(fetchedItems);
      setTotal(fetchedTotal);
      if (json.page && json.page !== p && !needsMassiveFetch) setPage(json.page);

    } catch (error) {
      console.error("Error cargando productos:", error);
      setProducts([]);
      setTotal(0);
    } finally {
      setIsFiltering(false); 
      setIsFetchingProducts(false);
    }
  };

  const prevFiltersRef = useRef({ searchTerm, filterType, filterSizes });

  useEffect(() => {
    if (loading) return;

    const filtersChanged =
      prevFiltersRef.current.searchTerm !== searchTerm ||
      prevFiltersRef.current.filterType !== filterType ||
      prevFiltersRef.current.filterSizes !== filterSizes;

    prevFiltersRef.current = { searchTerm, filterType, filterSizes };

    if (filtersChanged && page !== 1) {
      setPage(1);
      return;
    }

    fetchProducts({ page: filtersChanged ? 1 : page, q: searchTerm, type: filterType, sizes: filterSizes });
  }, [loading, page, searchTerm, filterType, filterSizes]);

  useEffect(() => {
    if (!loading && !isFetchingProducts && pendingScroll && products.length > 0) {
      setTimeout(() => {
        const catalogo = document.getElementById("catalogo-top");
        if (catalogo) {
          const rect = catalogo.getBoundingClientRect();
          const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
          window.scrollTo({ top: rect.top + scrollTop - 100, behavior: "smooth" });
        }
      }, 300);
      setPendingScroll(false);
    } else if (!loading && isFirstRun.current && !pendingScroll) {
      window.scrollTo(0, 0);
      isFirstRun.current = false;
    }
  }, [loading, isFetchingProducts, pendingScroll, products]);

  // 📄 Cambio de página: sube al inicio de la grilla (título "Colección" incluido) en vez de quedarse abajo.
  // El destino usa la altura real del header fijo (distinta en celular y desktop).
  const gridTopOffset = () => {
    if (!pageTopRef.current) return null;
    const header = document.querySelector("header");
    const headerH = header ? header.getBoundingClientRect().height : 0;
    return pageTopRef.current.getBoundingClientRect().top - headerH - 16;
  };
  const scrollToGrid = (behavior = "smooth") => {
    const off = gridTopOffset();
    if (off === null) return;
    window.scrollTo({ top: Math.max(0, window.scrollY + off), behavior });
  };
  const pendingPageScrollRef = useRef(false);
  const goToPage = (n) => {
    if (n === page) return;
    pendingPageScrollRef.current = true;
    setPage(n);
    scrollToGrid("smooth");
  };

  // Cuando llegan los productos de la nueva página, corrige la posición si la altura cambió mientras cargaba
  useEffect(() => {
    if (isFetchingProducts || !pendingPageScrollRef.current) return;
    pendingPageScrollRef.current = false;
    requestAnimationFrame(() => {
      const off = gridTopOffset();
      if (off !== null && Math.abs(off) > 40) scrollToGrid("auto");
    });
  }, [isFetchingProducts]);

  useEffect(() => {
    if ('scrollRestoration' in window.history) window.history.scrollRestoration = 'manual';
  }, []);

  const handleProductUpdate = (updatedProduct, deletedId = null) => {
    if (deletedId) {
      setProducts((prev) => prev.filter((p) => getPid(p) !== String(deletedId)));
      return;
    }
    setProducts((prev) =>
      prev.map((p) => getPid(p) === getPid(updatedProduct) ? { ...p, ...updatedProduct } : p)
    );
  };

  function filteredProducts() {
    return products.filter((product) => {
      const normalize = (str) => str?.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
      const name = normalize(product.name || "");
      const matchesSearch = name.includes(normalize(searchTerm || ""));
      const hasStock = Object.values(product.stock || {}).some((qty) => Number(qty) > 0);
      const price = Number(product.price ?? 0);
      const dpRaw = product.discountPrice;
      const dp = dpRaw === null || dpRaw === undefined ? null : Number(dpRaw);
      const isOffer = Number.isFinite(dp) && dp > 0 && dp < price;

      const matchesSizes = filterSizes.length === 0 || filterSizes.some((sizeABuscar) => {
        if (!product.stock) return false;
        const cleanSize = sizeABuscar.trim().toLowerCase();
        const claveReal = Object.keys(product.stock).find(k => k.trim().toLowerCase() === cleanSize);
        return claveReal ? Number(product.stock[claveReal]) > 0 : false;
      });

      if (!matchesSizes) return false;

      if (filterType === "Mundial") return matchesSearch && product.isMundial === true;
      if (filterType === "Ofertas") return matchesSearch && isOffer;
      if (filterType === "Nuevos") return matchesSearch;
      if (window.__verDisponiblesActivo) {
        const noDiscount = !Number.isFinite(dp) || dp <= 0 || dp >= price;
        return matchesSearch && hasStock && noDiscount;
      }
      if (filterType) {
        const productType = normalize(product.type || "");
        const filter = normalize(filterType);
        return matchesSearch && productType.includes(filter);
      }
      return matchesSearch;
    });
  }

  const listaFinalProductos = filteredProducts();

  // Muestra las tiras cuando está en "TODOS" (sin filtro activo ni búsqueda)
  const isViewingRows = !filterType && !searchTerm && filterSizes.length === 0;

  return (
    <CartProvider>
      <div className="min-h-screen w-full bg-white text-black antialiased">
        <CartDrawer />
        <Routes>
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          
          <Route 
            path="/product/:id" 
            element={
              <ProductDetail 
                user={user} 
                onUpdate={handleProductUpdate}
                onLoginClick={() => setShowLogin(true)}
                onLogout={handleLogout}
                setShowRegisterUserModal={setShowRegisterUserModal}
                setShowUserListModal={setShowUserListModal}
                onMedidasClick={() => setShowMedidas(true)}
              />
            } 
          />

          <Route path="/checkout" element={<Checkout />} />
          <Route path="/pago" element={<PaymentResult />} />

          <Route path="/pedidos" element={<ProtectedRoute user={user}><OrdersPage user={user} onLogout={handleLogout} setShowUserListModal={setShowUserListModal} /></ProtectedRoute>} /> 
          <Route path="/historial" element={<ProtectedRoute user={user}><HistoryPage user={user} onLogout={handleLogout} /></ProtectedRoute>} />
          <Route path="/ventas" element={<ProtectedRoute user={user}><SalesPage user={user} onLogout={handleLogout} /></ProtectedRoute>} />
          <Route path="/apartados" element={<ProtectedRoute user={user}><ApartadosPage user={user} /></ProtectedRoute>} />
          <Route path="/reportes" element={<ProtectedRoute user={user} requireAdmin={true}><DailyReportPage user={user} onLogout={handleLogout} /></ProtectedRoute>} />
          <Route path="/balance" element={<ProtectedRoute user={user} requireAdmin={true}><BalancePage user={user} onLogout={handleLogout} /></ProtectedRoute>} />

          <Route path="/" element={
            <AnimatePresence mode="wait">
              {loading ? (
                <InicioOverlay key="loader-global" onComplete={() => {
                  setLoading(false);
                  sessionStorage.setItem("introMundial", "true"); 
                }} />
              ) : (
                <motion.div
                  key="main-store-content"
                  initial={{ opacity: startedWithIntro ? 0 : 1 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.6, ease: "easeIn" }}
                  className="bg-white min-h-screen w-full relative" 
                >
                  {isFiltering && <LoadingOverlay message="Cargando catálogo..." />}
                  {showRegisterUserModal && <RegisterUserModal onClose={() => setShowRegisterUserModal(false)} />}
                  {showUserListModal && <UserListModal open={showUserListModal} onClose={() => setShowUserListModal(false)} />}
                  {showMedidas && <Medidas open={showMedidas} onClose={() => setShowMedidas(false)} currentType={filterType || "Todos"} />}
                  {showAddModal && <AddProductModal user={user} tallaPorTipo={tallaPorTipo} onAdd={(newProduct) => { setProducts(prev => [newProduct, ...prev]); setShowAddModal(false); toast.success("Producto agregado"); }} onCancel={() => setShowAddModal(false)} />}
                  {showLogin && <LoginModal isOpen={showLogin} onClose={() => setShowLogin(false)} onLoginSuccess={(userData) => { setUser(userData); localStorage.setItem("user", JSON.stringify(userData)); setShowLogin(false); toast.success("Bienvenido"); }} onRegisterClick={() => setTimeout(() => setShowRegisterUserModal(true), 100)} />}

                  <Header
                      onLoginClick={() => setShowLogin(true)}
                      onLogout={handleLogout}
                      onLogoClick={() => { setFilterType(""); setSearchTerm(""); setFilterSizes([]); setPage(1); }}
                      onMedidasClick={() => setShowMedidas(true)}
                      user={user}
                      isSuperUser={isSuperUser}
                      canSeeHistory={canSeeHistory}
                      setShowRegisterUserModal={setShowRegisterUserModal}
                      setShowUserListModal={setShowUserListModal}
                      setFilterType={setFilterType}
                    />

                  <Bienvenido />
                  <WhatsAppFloat />
                  
                  {canAdd && (
                    <button aria-label="Agregar producto" className="fixed bottom-6 right-6 z-50 grid h-14 w-14 place-items-center rounded-full bg-black text-white shadow-[0_10px_30px_rgba(0,0,0,0.35)] ring-1 ring-white/20 transition hover:scale-105" onClick={() => setShowAddModal(true)}>
                      <FaPlus />
                    </button>
                  )}

                  {/* 🔥 CABECERA DE CAJITAS OSCURAS */}
                  <CatalogHeader 
                    filterType={filterType} 
                    setFilterType={setFilterType} 
                    setPage={setPage} 
                  />

                  {/* CONTENEDOR MAESTRO CON ID PARA EL SCROLL */}
                  <div id="catalogo-top" className="flex w-full flex-col items-center bg-gradient-to-b from-zinc-50 to-white pb-8 pt-8 sm:pt-10">
                    
                    {/* BARRA DE FILTROS */}
                    <div className="mb-10 w-full max-w-[1600px] px-4 sm:px-8">
                      <FilterBar 
                        searchTerm={searchTerm} 
                        setSearchTerm={setSearchTerm} 
                        filterType={filterType} 
                        setFilterType={setFilterType} 
                        filterSizes={filterSizes} 
                        setFilterSizes={setFilterSizes} 
                      />
                    </div>

                    {/* VISTA 1: TIRAS POR CATEGORÍA CON "VER MÁS" (CUANDO ESTÁ EN "TODOS") */}
                    {isViewingRows ? (
                      <div className="w-full">
                        <CategoryRow 
                          title="Player" 
                          categoryKey="Player" 
                          products={products} 
                          onSelectCategory={(cat) => {
                            setFilterType(cat);
                            setPage(1);
                          }} 
                          canEdit={canEdit} 
                          user={user} 
                        />
                        <CategoryRow 
                          title="Retro" 
                          categoryKey="Retro" 
                          products={products} 
                          onSelectCategory={(cat) => {
                            setFilterType(cat);
                            setPage(1);
                          }} 
                          canEdit={canEdit} 
                          user={user} 
                        />
                        <CategoryRow 
                          title="Fan" 
                          categoryKey="Fan" 
                          products={products} 
                          onSelectCategory={(cat) => {
                            setFilterType(cat);
                            setPage(1);
                          }} 
                          canEdit={canEdit} 
                          user={user} 
                        />
                        <CategoryRow 
                          title="Mujer" 
                          categoryKey="Mujer" 
                          products={products} 
                          onSelectCategory={(cat) => {
                            setFilterType(cat);
                            setPage(1);
                          }} 
                          canEdit={canEdit} 
                          user={user} 
                        />
                        <CategoryRow 
                          title="Nacional" 
                          categoryKey="Nacional" 
                          products={products} 
                          onSelectCategory={(cat) => {
                            setFilterType(cat);
                            setPage(1);
                          }} 
                          canEdit={canEdit} 
                          user={user} 
                        />
                        <CategoryRow 
                          title="Ofertas" 
                          categoryKey="Ofertas" 
                          products={products} 
                          onSelectCategory={(cat) => {
                            setFilterType(cat);
                            setPage(1);
                          }} 
                          canEdit={canEdit} 
                          user={user} 
                        />
                      </div>
                    ) : (
                      /* VISTA 2: GRILLA COMPLETA CUANDO SE SELECCIONA UNA CATEGORÍA O SE BUSCA */
                      <div className="w-full max-w-[1600px] px-4 sm:px-8">
                        {/* Siempre visible (también mientras carga) para que la grilla no salte al cambiar de página */}
                        <div ref={pageTopRef}>
                          <div className="mb-5 flex items-end justify-between">
                            <div>
                              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-cyan-600">{searchTerm ? "Resultados" : "Colección"}</p>
                              <h2 className="font-display text-3xl uppercase leading-none tracking-wide text-black sm:text-4xl">
                                {searchTerm ? `“${searchTerm}”` : filterType || "Catálogo"}
                              </h2>
                            </div>
                            {!isFetchingProducts && (
                              <span className="text-xs font-semibold text-zinc-400">{listaFinalProductos.length} productos</span>
                            )}
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                          {isFetchingProducts ? (
                            // Tantos esqueletos como productos por página: la altura no se encoge al cambiar de página
                            Array.from({ length: limit }).map((_, idx) => (
                              <ProductSkeleton key={`skeleton-${idx}`} />
                            ))
                          ) : listaFinalProductos.length === 0 ? (
                            <div className="col-span-full flex flex-col items-center gap-3 rounded-3xl border border-dashed border-zinc-200 py-20 text-center">
                              <span className="font-display text-4xl uppercase text-zinc-300">Sin resultados</span>
                              <p className="text-sm text-zinc-500">No se encontraron productos con estos filtros.</p>
                              <button
                                onClick={() => { setSearchTerm(""); setFilterType(""); setFilterSizes([]); }}
                                className="mt-2 rounded-full bg-black px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-zinc-800"
                              >
                                Ver todo el catálogo
                              </button>
                            </div>
                          ) : (
                            listaFinalProductos.map((product) => (
                              <ProductCard
                                canEdit={canEdit}
                                key={getPid(product)}
                                product={product}
                                user={user}
                                onClick={() => window.location.assign(`/product/${getPid(product)}`)}
                              />
                            ))
                          )}
                        </div>

                        {/* Paginación */}
                        {!isFetchingProducts && pages > 1 && (
                          <div className="mt-12 flex flex-col items-center gap-3">
                            <nav className="flex items-center justify-center gap-1.5" aria-label="Paginación">
                              <button onClick={() => goToPage(Math.max(1, page - 1))} disabled={page === 1} aria-label="Anterior" className="grid h-10 w-10 place-items-center rounded-full border border-zinc-200 bg-white text-black transition hover:border-black disabled:opacity-40"><FaChevronLeft size={12} /></button>
                              {buildPages(page, pages).map((n, i, arr) => (
                                <React.Fragment key={n}>
                                  {i > 0 && n - arr[i - 1] > 1 && <span className="px-1 text-zinc-400">…</span>}
                                  <button
                                    onClick={() => goToPage(n)}
                                    aria-current={n === page ? "page" : undefined}
                                    className={`grid h-10 min-w-10 place-items-center rounded-full border px-3 text-sm font-bold transition ${n === page ? "border-black bg-black text-white" : "border-zinc-200 bg-white text-zinc-700 hover:border-black"}`}
                                  >
                                    {n}
                                  </button>
                                </React.Fragment>
                              ))}
                              <button onClick={() => goToPage(Math.min(pages, page + 1))} disabled={page === pages} aria-label="Siguiente" className="grid h-10 w-10 place-items-center rounded-full border border-zinc-200 bg-white text-black transition hover:border-black disabled:opacity-40"><FaChevronRight size={12} /></button>
                            </nav>
                          </div>
                        )}
                      </div>
                    )}

                  </div>

                  <Footer />
                </motion.div>
              )}
            </AnimatePresence>
          } />
        </Routes>
        <FutToaster />
      </div>
    </CartProvider>
  );
}

export default function App() {
  return (
    <Router>
      <MainApp />
    </Router>
  );
}