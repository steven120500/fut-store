function CategoryRow({ title, categoryKey, products, onSelectCategory, canEdit, user }) {
    const normalize = (str) => str?.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    
    const filteredItems = products.filter((product) => {
      const productType = normalize(product.type || "");
      const productName = normalize(product.name || "");
      const target = normalize(categoryKey);
      
      if (categoryKey === "Ofertas") {
        const price = Number(product.price ?? 0);
        const dp = Number(product.discountPrice ?? 0);
        return dp > 0 && dp < price;
      }
  
      // Mapeo especial por si en la base de datos se guardan con otro término (ej: Costa Rica, Saprissa, Liga, etc. para Nacional)
      if (categoryKey === "Nacional") {
        return productType.includes("nacional") || productName.includes("nacional") || productName.includes("costa rica") || productName.includes("saprissa") || productName.includes("alajuelense") || productName.includes("herediano");
      }
  
      if (categoryKey === "Mujer") {
        return productType.includes("mujer") || productName.includes("mujer") || productName.includes("dama") || productName.includes("fem");
      }
      
      return productType.includes(target) || productName.includes(target);
    }).slice(0, 5); // Muestra las primeras 5 tarjetas de la tira perfectamente
  
    if (filteredItems.length === 0) return null;
  
    return (
      <div className="w-full max-w-[1800px] mx-auto px-4 sm:px-8 mb-12">
        <div className="flex justify-between items-end mb-4 border-b border-gray-200 pb-2">
          <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-black">
            {title}
          </h2>
          
          <button
            onClick={() => onSelectCategory(categoryKey)}
            className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-black hover:text-gray-600 transition group cursor-pointer"
          >
            Ver más 
            <span className="w-5 h-5 rounded-full bg-black text-white flex items-center justify-center transition group-hover:translate-x-1">
              <span className="text-[10px] font-bold">→</span>
            </span>
          </button>
        </div>
  
        <div className="grid grid-cols-2 gap-y-6 gap-x-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {filteredItems.map((product) => (
            <ProductCard
              canEdit={canEdit}
              key={getPid(product)}
              product={product}
              user={user}
              onClick={() => window.location.assign(`/product/${getPid(product)}`)}
            />
          ))}
        </div>
      </div>
    );
  }