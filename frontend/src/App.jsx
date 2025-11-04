import { Toaster } from "react-hot-toast";
import React, { useEffect, useRef, useState } from "react";
import Header from "./components/Header";
import ProductCard from "./components/ProductCard";
import ProductModal from "./components/ProductModal";
import AddProductModal from "./components/AddProductModal";
import LoginModal from "./components/LoginModal";
import RegisterUserModal from "./components/RegisterUserModal";
import Footer from "./components/Footer";
import LoadingOverlay from "./components/LoadingOverlay";
import tallaPorTipo from "./utils/tallaPorTipo";
import { FaPlus, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./index.css";
import TopBanner from "./components/TopBanner";
import UserListModal from "./components/UserListModal";
import HistoryModal from "./components/HistoryModal";
import Medidas from "./components/Medidas";
import Bienvenido from "./components/Bienvenido";
import FilterBar from "./components/FilterBar";

const API_BASE = "https://fut-store.onrender.com";
const GOLD = "#9E8F91";

// 🔹 Función auxiliar para paginación
function buildPages(page, pages) {
  const out = new Set([1, pages, page, page - 1, page - 2, page + 1, page + 2]);
  return [...out].filter((n) => n >= 1 && n <= pages).sort((a, b) => a - b);
}

// 🔹 Obtiene el ID del producto
const getPid = (p) => String(p?._id ?? p?.id ?? "");

// 🔹 Componente principal
export default function App() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterSizes, setFilterSizes] = useState([]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showRegisterUserModal, setShowRegisterUserModal] = useState(false);
  const [showUserListModal, setShowUserListModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showMedidas, setShowMedidas] = useState(false);

  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [total, setTotal] = useState(0);
  const pages = Math.max(1, Math.ceil(total / limit));
  const pageTopRef = useRef(null);

  const [user, setUser] = useState(() => {
    try {
      const storedUser = localStorage.getItem("user");
      return storedUser ? JSON.parse(storedUser) : null;
    } catch {
      return null;
    }
  });

  const isSuperUser = user?.isSuperUser || false;
  const canSeeHistory = user?.isSuperUser || user?.roles?.includes("history");
  const canAdd = user?.isSuperUser || user?.roles?.includes("add");
  const canEdit = user?.isSuperUser || user?.roles?.includes("edit");
  const canDelete = user?.isSuperUser || user?.roles?.includes("delete");

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("user");
    toast.success("Sesión cerrada correctamente");
  };

  // 🔹 Cargar productos desde el backend
  const fetchProducts = async (opts = {}) => {
    const p = opts.page ?? page;
    const q = (opts.q ?? searchTerm).trim();
    const tp = (opts.type ?? filterType).trim();
    const sizes = (opts.sizes ?? filterSizes).join(",");

    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(p),
        limit: "20",
        ...(q ? { q } : {}),
        ...(tp ? { type: tp } : {}),
        ...(sizes ? { sizes } : {}),
      });
      const res = await fetch(`${API_BASE}/api/products?${params.toString()}`);
      if (!res.ok) throw new Error("HTTP " + res.status);
      const json = await res.json();
      setProducts(json.items);
      setTotal(json.total);
      setPage(json.page);
    } catch {
      setProducts([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  // 🔁 Recargar productos con scroll ajustado
  useEffect(() => {
    fetchProducts({ page, q: searchTerm, type: filterType, sizes: filterSizes });
    if (pageTopRef.current) {
      const rect = pageTopRef.current.getBoundingClientRect();
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const targetY = rect.top + scrollTop;
      window.scrollTo({ top: targetY - 120, behavior: "smooth" });
    }
  }, [page, searchTerm, filterType, filterSizes]);

  // ✅ Escucha “Ver Ofertas”
  useEffect(() => {
    const handleFiltrarOfertas = () => {
      setFilterType("Ofertas");
      setPage(1);
      fetchProducts({ page: 1, type: "Ofertas" });
      setTimeout(() => {
        if (pageTopRef.current) {
          const y = pageTopRef.current.getBoundingClientRect().top + window.scrollY;
          window.scrollTo({ top: y - 150, behavior: "smooth" });
        }
      }, 400);
    };

    window.addEventListener("filtrarOfertas", handleFiltrarOfertas);
    return () => window.removeEventListener("filtrarOfertas", handleFiltrarOfertas);
  }, []);

  // ✅ Escucha “Ver Disponibles” (sin ofertas ni descuentos)
  useEffect(() => {
    const handleFiltrarDisponibles = async () => {
      setFilterType("");
      setSearchTerm("");
      setPage(1);
      await fetchProducts({ page: 1, type: "" });

      setTimeout(() => {
        if (pageTopRef.current) {
          const y = pageTopRef.current.getBoundingClientRect().top + window.scrollY;
          window.scrollTo({ top: y - 100, behavior: "smooth" });
        }
      }, 500);
    };

    window.addEventListener("filtrarDisponibles", handleFiltrarDisponibles);
    return () => window.removeEventListener("filtrarDisponibles", handleFiltrarDisponibles);
  }, []);

  // 🔹 Actualizar producto o eliminarlo
  const handleProductUpdate = (updatedProduct, deletedId = null) => {
    if (deletedId) {
      setProducts((prev) => prev.filter((p) => getPid(p) !== String(deletedId)));
      setSelectedProduct(null);
      toast.success("Producto eliminado correctamente");
      return;
    }
    setProducts((prev) =>
      prev.map((p) => (getPid(p) === getPid(updatedProduct) ? { ...p, ...updatedProduct } : p))
    );
    toast.success("Producto actualizado correctamente");
  };

  // 🔹 Filtro local (sin ofertas, sin descuentos, con stock)
  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name
      ?.toLowerCase()
      .includes(searchTerm.toLowerCase());

    // Tiene stock disponible
    const hasStock = Object.values(product.stock || {}).some((qty) => qty > 0);

    // Detecta si es oferta o tiene descuento
    const isOffer =
      product.type?.toLowerCase().includes("oferta") ||
      product.tags?.includes("oferta") ||
      product.discount > 0 ||
      product.hasDiscount === true;

    return matchesSearch && hasStock && !isOffer;
  });

  return (
    <>
      {/* Modales */}
      {showRegisterUserModal && (
        <RegisterUserModal onClose={() => setShowRegisterUserModal(false)} />
      )}
      {showUserListModal && (
        <UserListModal
          open={showUserListModal}
          onClose={() => setShowUserListModal(false)}
        />
      )}
      {showHistoryModal && (
        <HistoryModal
          open={showHistoryModal}
          onClose={() => setShowHistoryModal(false)}
          isSuperUser={user?.isSuperUser === true}
          roles={user?.roles || []}
        />
      )}
      {showMedidas && (
        <Medidas
          open={showMedidas}
          onClose={() => setShowMedidas(false)}
          currentType={filterType || "Todos"}
        />
      )}

      {loading && <LoadingOverlay message="Cargando productos..." />}

      {/* 🔝 TopBanner + Header fijos */}
      <div className="fixed top-0 left-0 w-full z-50">
        <TopBanner />
        {!selectedProduct &&
          !showAddModal &&
          !showLogin &&
          !showRegisterUserModal &&
          !showUserListModal &&
          !showHistoryModal &&
          !showMedidas && (
            <Header
              onLoginClick={() => setShowLogin(true)}
              onLogout={handleLogout}
              onLogoClick={() => {
                setFilterType("");
                setSearchTerm("");
                setPage(1);
              }}
              onMedidasClick={() => setShowMedidas(true)}
              user={user}
              isSuperUser={isSuperUser}
              canSeeHistory={canSeeHistory}
              setShowRegisterUserModal={setShowRegisterUserModal}
              setShowUserListModal={setShowUserListModal}
              setShowHistoryModal={setShowHistoryModal}
              setFilterType={setFilterType}
            />
          )}
      </div>

      {/* Espaciador para el header fijo */}
      <div className="h-[120px]" />

      {/* Bienvenida */}
      <Bienvenido />

      {/* Barra de filtros */}
      <FilterBar
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        filterType={filterType}
        setFilterType={setFilterType}
        filterSizes={filterSizes}
        setFilterSizes={setFilterSizes}
      />

      {/* Botón de agregar */}
      {canAdd && (
        <button
          className="fixed bottom-6 fondo-plateado right-6 text-black p-4 rounded-full shadow-lg transition z-50"
          onClick={() => setShowAddModal(true)}
          title="Añadir producto"
        >
          <FaPlus />
        </button>
      )}

      {/* Lista de productos */}
      <div className="relative w-full">
        <div
          ref={pageTopRef}
          className="relative z-10 px-4 grid grid-cols-2 gap-y-6 gap-x-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:gap-x-8"
        >
          {filteredProducts.map((product) => (
            <ProductCard
              canEdit={canEdit}
              key={getPid(product)}
              product={product}
              onClick={() => setSelectedProduct(product)}
              user={user}
            />
          ))}
        </div>
      </div>

      {/* Modal producto */}
      {selectedProduct && (
        <ProductModal
          key={`${getPid(selectedProduct)}-${selectedProduct.updatedAt || ""}`}
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onUpdate={handleProductUpdate}
          canEdit={canEdit}
          canDelete={canDelete}
          user={user}
        />
      )}

      {/* Modal agregar */}
      {showAddModal && (
        <AddProductModal
          user={user}
          tallaPorTipo={tallaPorTipo}
          onAdd={(newProduct) => {
            setProducts((prev) => [newProduct, ...prev]);
            setShowAddModal(false);
            toast.success("Producto agregado correctamente");
          }}
          onCancel={() => setShowAddModal(false)}
        />
      )}

      {/* Modal login */}
      {showLogin && (
        <LoginModal
          isOpen={showLogin}
          onClose={() => setShowLogin(false)}
          onLoginSuccess={(userData) => {
            setUser(userData);
            localStorage.setItem("user", JSON.stringify(userData));
            setShowLogin(false);
            toast.success("Bienvenido");
          }}
          onRegisterClick={() =>
            setTimeout(() => setShowRegisterUserModal(true), 100)
          }
        />
      )}

      {/* Paginación */}
      {pages > 1 && (
        <div className="mt-8 flex flex-col items-center gap-3">
          <nav className="flex items-center justify-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-2 py-1 text-sm text-black fondo-plateado rounded border disabled:opacity-50"
              title="Anterior"
            >
              <FaChevronLeft />
            </button>
            {(() => {
              const nums = buildPages(page, pages);
              return nums.map((n, i) => {
                const prev = nums[i - 1];
                const showDots = i > 0 && n - prev > 1;
                return (
                  <span key={n} className="flex">
                    {showDots && <span className="px-2">…</span>}
                    <button
                      onClick={() => setPage(n)}
                      className={`px-2 text-sm py-0.5 rounded border ${
                        n === page
                          ? "text-black fondo-plateado"
                          : "hover:bg-green-700"
                      }`}
                      style={{
                        backgroundColor: n === page ? GOLD : "transparent",
                        borderColor: n === page ? GOLD : "#ccc",
                      }}
                    >
                      {n}
                    </button>
                  </span>
                );
              });
            })()}
            <button
              onClick={() => setPage((p) => Math.min(pages, p + 1))}
              disabled={page === pages}
              className="px-2 py-1 text-sm text-black fondo-plateado rounded border disabled:opacity-50"
              title="Siguiente"
            >
              <FaChevronRight />
            </button>
          </nav>
        </div>
      )}

      {/* Footer */}
      <Footer />
      <ToastContainer />
      <Toaster position="top-center" reverseOrder={false} />
    </>
  );
}
