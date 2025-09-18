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
import { FaPlus, FaChevronLeft, FaChevronRight, FaFilter } from "react-icons/fa";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./index.css";
import UserListModal from "./components/UserListModal";
import HistoryModal from "./components/HistoryModal";
import Medidas from "./components/Medidas";
import fotofondo from "./assets/fotofondo.jpg";

const API_BASE = "https://fut-store.onrender.com";
const GOLD = "#d4af37";

function buildPages(page, pages) {
  const out = new Set([1, pages, page, page - 1, page - 2, page + 1, page + 2]);
  return [...out].filter((n) => n >= 1 && n <= pages).sort((a, b) => a - b);
}

const getPid = (p) => String(p?._id ?? p?.id ?? "");

function App() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showRegisterUserModal, setShowRegisterUserModal] = useState(false);
  const [showUserListModal, setShowUserListModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showMedidas, setShowMedidas] = useState(false);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [total, setTotal] = useState(0);
  const pages = Math.max(1, Math.ceil(total / limit));

  const [showFilters, setShowFilters] = useState(false);

  const anyModalOpen =
    !!selectedProduct ||
    showAddModal ||
    showLogin ||
    showRegisterUserModal ||
    showUserListModal ||
    showHistoryModal ||
    showMedidas;

  const [user, setUser] = useState(() => {
    try {
      const storedUser = localStorage.getItem("user");
      return storedUser ? JSON.parse(storedUser) : null;
    } catch (error) {
      console.error("Error parsing user from localStorage", error);
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

  const fetchProducts = async (opts = {}) => {
    const p = opts.page ?? page;
    const q = (opts.q ?? searchTerm).trim();
    const tp = (opts.type ?? filterType).trim();
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(p),
        limit: String(limit),
        ...(q ? { q } : {}),
        ...(tp ? { type: tp } : {}),
      });
      const res = await fetch(`${API_BASE}/api/products?${params.toString()}`);
      if (!res.ok) throw new Error("HTTP " + res.status);
      const json = await res.json();
      setProducts(json.items);
      setTotal(json.total);
      setPage(json.page);
    } catch (e) {
      console.error("fetchProducts error:", e);
      setProducts([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  const pageTopRef = useRef(null);
  useEffect(() => {
    fetchProducts({ page, q: searchTerm, type: filterType });
    if (pageTopRef.current) {
      pageTopRef.current.scrollIntoView({ behavior: "smooth" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, searchTerm, filterType]);

  const handleProductUpdate = (updatedProduct, deletedId = null) => {
    if (deletedId) {
      setProducts((prev) => prev.filter((p) => getPid(p) !== String(deletedId)));
      setSelectedProduct(null);
      toast.success("Producto eliminado correctamente");
      return;
    }
    setProducts((prev) =>
      prev.map((p) =>
        getPid(p) === getPid(updatedProduct) ? { ...p, ...updatedProduct } : p
      )
    );
    setSelectedProduct((prev) =>
      prev && getPid(prev) === getPid(updatedProduct)
        ? { ...prev, ...updatedProduct }
        : prev
    );
    toast.success("Producto actualizado correctamente");
  };

  const filteredProducts = products.filter((product) => {
    const matchName = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchType = filterType ? product.type === filterType : true;
    return matchName && matchType;
  });

  const filterOptions = [
    "Player",
    "Fan",
    "Mujer",
    "Niño",
    "Retro",
    "Abrigos",
    "Nacional",
    "Todos",
  ];

  return (
    <>
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
      {!anyModalOpen && (
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

      {/* Imagen de fondo */}
      <section
        className="relative w-full h-screen bg-cover bg-center flex items-center justify-center"
        style={{ backgroundImage: `url(${fotofondo})` }}
      >
        <div className="absolute inset-0 bg-black/70"></div>
        <div className="relative z-o bg-black/50 p-6 rounded-lg animate-fadeIn">
          <h1 className="text-3xl z-0 sm:text-5xl font-bold text-white text-center">
            Bienvenido a <span style={{ color: GOLD }}>FutStore</span>
          </h1>
        </div>
      </section>

      {/* Barra de búsqueda + filtro */}
      <div
        ref={pageTopRef}
        className="relative w-full bg-white shadow-sm z-0 pt-4 pb-2 sm:pb-4 px-4 sm:px-6 flex items-center gap-2"
      >
        <input
          type="text"
          placeholder="Buscar productos..."
          className="flex-1 sm:w-[200px] px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 text-sm"
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setPage(1);
          }}
        />
        <div className="relative">
          <button
            className="flex items-center gap-2 px-4 py-2 rounded-md text-black font-semibold"
            style={{ backgroundColor: GOLD }}
            onClick={() => setShowFilters((prev) => !prev)}
          >
            <FaFilter /> {filterType || "Filtros"}
          </button>
          {showFilters && (
            <div className="absolute mt-2 w-40 bg-white rounded shadow-lg z-50">
              {filterOptions.map((type) => (
                <button
                  key={type}
                  onClick={() => {
                    setFilterType(type === "Todos" ? "" : type);
                    setPage(1);
                    setShowFilters(false);
                  }}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-200"
                >
                  {type}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {canAdd && !anyModalOpen && (
        <button
          className="fixed bottom-6 right-6 text-black p-4 rounded-full shadow-lg transition z-50"
          onClick={() => setShowAddModal(true)}
          title="Añadir producto"
          style={{ backgroundColor: GOLD }}
        >
          <FaPlus />
        </button>
      )}
      <div className="px-4 grid grid-cols-2 gap-y-6 gap-x-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:gap-x-8">
        {filteredProducts.map((product) => (
          <ProductCard
            key={getPid(product)}
            product={product}
            onClick={() => setSelectedProduct(product)}
          />
        ))}
      </div>
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
      {pages > 1 && (
        <div className="mt-8 flex flex-col items-center gap-3">
          <nav className="flex items-center justify-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-2 py-1 text-sm text-white  rounded border disabled:opacity-50"
              title="Anterior"
              style={{
                backgroundColor: "#d4af37",
                color: "#000",
                fontSize: "1.5rem",
              }}
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
                        n === page ? "text-black" : "hover:bg-gray-100"
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
              className="px-2 py-1 text-sm text-white bg-black rounded border disabled:opacity-50"
              title="Siguiente"
              style={{
                backgroundColor: "#d4af37",
                color: "#000",
                fontSize: "1.5rem",
              }}
            >
              <FaChevronRight />
            </button>
          </nav>
        </div>
      )}
      <Footer />
      <ToastContainer />
      <Toaster position="top-center" reverseOrder={false} />
    </>
  );
}

export default App;