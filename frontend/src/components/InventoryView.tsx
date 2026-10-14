import React, { useState, useMemo } from 'react';
import { Product } from '../types';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import {
  Search,
  Filter,
  ArrowLeft,
  ShoppingCart,
  Plus,
  Minus,
  Check,
  X,
  SlidersHorizontal,
  Eye,
  ShieldCheck,
  Truck,
} from 'lucide-react';

interface InventoryViewProps {
  products: Product[];
  loading: boolean;
  onBackToHome: () => void;
  onOpenAuth: () => void;
  onGoToCart: () => void;
}

export const InventoryView: React.FC<InventoryViewProps> = ({
  products,
  loading,
  onBackToHome,
  onOpenAuth,
  onGoToCart,
}) => {
  const { addToCart, totalItems } = useCart();
  const { user } = useAuth();

  // Working filters & search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sortBy, setSortBy] = useState<'default' | 'price-asc' | 'price-desc' | 'stock'>('default');
  const [quantities, setQuantities] = useState<{ [id: string]: number }>({});
  const [addedPopup, setAddedPopup] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Auto-categorize products based on title/description
  const getCategory = (product: Product): string => {
    const text = (product.name + ' ' + (product.description || '')).toLowerCase();
    if (text.includes('macbook') || text.includes('laptop') || text.includes('computer')) return 'Laptops';
    if (text.includes('keyboard') || text.includes('keychron')) return 'Keyboards';
    if (text.includes('mouse') || text.includes('master') || text.includes('logitech')) return 'Mice';
    if (text.includes('monitor') || text.includes('dell') || text.includes('display') || text.includes('screen')) return 'Monitors';
    if (text.includes('headphone') || text.includes('sony') || text.includes('audio')) return 'Audio';
    return 'Electronics';
  };

  // Map product image
  const getProductImage = (product: Product): string => {
    if (product.imageUrl) return product.imageUrl;
    const text = (product.name + ' ' + (product.description || '')).toLowerCase();
    if (text.includes('macbook') || text.includes('laptop')) return '/products/macbook.jpg';
    if (text.includes('keyboard') || text.includes('keychron')) return '/products/keyboard.jpg';
    if (text.includes('mouse') || text.includes('master') || text.includes('logitech')) return '/products/mouse.jpg';
    if (text.includes('monitor') || text.includes('ultrasharp') || text.includes('display')) return '/products/monitor.jpg';
    if (text.includes('headphone') || text.includes('sony') || text.includes('audio')) return '/products/headphones.jpg';
    return '/products/macbook.jpg';
  };

  const categories = ['All', 'Laptops', 'Keyboards', 'Mice', 'Monitors', 'Audio'];

  // Filtered & sorted products list
  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        // Search filter
        if (searchQuery.trim()) {
          const query = searchQuery.toLowerCase();
          const matches =
            p.name.toLowerCase().includes(query) ||
            (p.description && p.description.toLowerCase().includes(query));
          if (!matches) return false;
        }

        // Category filter
        if (selectedCategory !== 'All') {
          if (getCategory(p) !== selectedCategory) return false;
        }

        // Stock filter
        if (inStockOnly && p.stock <= 0) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'price-asc') return Number(a.price) - Number(b.price);
        if (sortBy === 'price-desc') return Number(b.price) - Number(a.price);
        if (sortBy === 'stock') return b.stock - a.stock;
        return 0;
      });
  }, [products, searchQuery, selectedCategory, inStockOnly, sortBy]);

  const handleQtyChange = (productId: string, val: number, maxStock: number) => {
    const nextVal = Math.max(1, Math.min(val, maxStock));
    setQuantities((prev) => ({ ...prev, [productId]: nextVal }));
  };

  const handleAdd = (product: Product, e: React.MouseEvent) => {
    if (!user) {
      onOpenAuth();
      return;
    }

    const qty = quantities[product.id] || 1;
    addToCart(product, qty, e);

    setAddedPopup(`Added ${qty} × "${product.name}" to cart`);
    setTimeout(() => setAddedPopup(null), 2500);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-20">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-200">
        <div>
          <button
            onClick={onBackToHome}
            className="flex items-center text-xs font-bold text-slate-500 hover:text-[#0284C7] transition group mb-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1 group-hover:-translate-x-1 transition" />
            Back to Home
          </button>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            Store Catalog & Inventory
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time stock availability, instant dispatch & direct ordering
          </p>
        </div>

        {/* View Cart Button */}
        <button
          onClick={onGoToCart}
          className="flex items-center self-start sm:self-auto space-x-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-sm transition active:scale-95"
        >
          <ShoppingCart className="w-4 h-4 text-[#FACC15]" />
          <span>View Cart</span>
          {totalItems > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-[#FACC15] text-slate-950 font-black text-[10px] font-mono ml-1">
              {totalItems}
            </span>
          )}
        </button>
      </div>

      {/* Added to cart toast popup */}
      {addedPopup && (
        <div className="fixed bottom-6 right-6 z-50 p-4 bg-white border-2 border-emerald-500 text-slate-900 rounded-2xl shadow-xl flex items-center space-x-3 text-xs font-bold animate-bounce">
          <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center">
            <Check className="w-3.5 h-3.5 stroke-[3]" />
          </div>
          <span>{addedPopup}</span>
          <button onClick={onGoToCart} className="underline text-sky-600 ml-2 font-black">Open Cart</button>
        </div>
      )}

      {/* Filter and Search Controls */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 mb-8 shadow-sm space-y-4">
        {/* Search & Sort Controls */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Live Search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products by model, brand, specifications..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-sky-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Sort & In-Stock Filter */}
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1.5 text-xs text-slate-600 whitespace-nowrap font-semibold">
              <SlidersHorizontal className="w-3.5 h-3.5 text-sky-600" />
              <span>Sort:</span>
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-sky-500 font-semibold"
            >
              <option value="default">Featured</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="stock">Highest Stock</option>
            </select>

            <button
              onClick={() => setInStockOnly(!inStockOnly)}
              className={`px-3 py-2 rounded-xl border text-xs font-bold transition flex items-center space-x-1.5 ${
                inStockOnly
                  ? 'bg-sky-50 border-sky-400 text-sky-700'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              <span>In Stock Only</span>
            </button>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                selectedCategory === cat
                  ? 'bg-[#0284C7] text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="text-center py-16">
          <div className="w-10 h-10 border-3 border-[#EAB308] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-500 font-medium">Fetching catalog items...</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 p-8 max-w-md mx-auto">
          <h2 className="text-base font-bold text-slate-900 mb-1">No products match your criteria</h2>
          <p className="text-xs text-slate-500 mb-4">Try clearing filters or checking back later.</p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('All');
              setInStockOnly(false);
            }}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        /* Strict 2-column e-commerce grid on mobile and desktop */
        <div className="grid grid-cols-2 gap-3 sm:gap-6 max-w-5xl mx-auto">
          {filteredProducts.map((product) => {
            const isOutOfStock = product.stock <= 0;
            const selectedQty = quantities[product.id] || 1;
            const categoryTag = getCategory(product);
            const img = getProductImage(product);

            return (
              <div
                key={product.id}
                className="bg-white border border-slate-200 hover:border-sky-300 rounded-2xl overflow-hidden flex flex-col justify-between shadow-sm hover:shadow-md transition duration-200 group"
              >
                {/* Product Image Showcase with Click to Detail */}
                <div
                  onClick={() => setSelectedProduct(product)}
                  className="relative w-full h-36 sm:h-64 bg-slate-100 overflow-hidden cursor-pointer"
                  title="Click to view details"
                >
                  <img
                    src={img}
                    alt={product.name}
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition duration-300"
                    loading="lazy"
                  />
                  {/* Hover Quick View Pill */}
                  <div className="absolute inset-0 bg-slate-950/20 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                    <span className="px-2.5 py-1 bg-white/95 text-slate-900 rounded-lg text-[10px] font-black flex items-center gap-1 shadow-sm">
                      <Eye className="w-3 h-3 text-sky-600" /> Quick View
                    </span>
                  </div>

                  {/* Category Pill Tag */}
                  <span className="absolute top-2 left-2 sm:top-3 sm:left-3 text-[9px] sm:text-[11px] font-bold uppercase tracking-wider text-sky-800 bg-white/95 backdrop-blur-sm border border-slate-200 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md sm:rounded-lg shadow-sm">
                    {categoryTag}
                  </span>

                  {/* Stock Pill Badge */}
                  <span
                    className={`absolute top-2 right-2 sm:top-3 sm:right-3 text-[9px] sm:text-[11px] px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md sm:rounded-lg font-bold shadow-sm backdrop-blur-sm ${
                      isOutOfStock
                        ? 'bg-rose-50/95 text-rose-700 border border-rose-200'
                        : product.stock < 10
                        ? 'bg-amber-50/95 text-amber-800 border border-amber-200'
                        : 'bg-emerald-50/95 text-emerald-800 border border-emerald-200'
                    }`}
                  >
                    {isOutOfStock ? 'Sold Out' : `${product.stock} in stock`}
                  </span>
                </div>

                {/* Details Section */}
                <div className="p-3 sm:p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <h2
                      onClick={() => setSelectedProduct(product)}
                      className="cursor-pointer text-xs sm:text-base font-extrabold text-slate-900 group-hover:text-[#0284C7] transition line-clamp-1 sm:line-clamp-2"
                      title={product.name}
                    >
                      {product.name}
                    </h2>
                    {product.description && (
                      <p className="hidden sm:block text-xs text-slate-500 leading-relaxed line-clamp-2 mt-1.5 mb-4">
                        {product.description}
                      </p>
                    )}
                  </div>

                  {/* Price & Actions Row */}
                  <div className="pt-2 sm:pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3">
                    <div>
                      <div className="text-[9px] sm:text-[10px] text-slate-400 uppercase font-bold">Price</div>
                      <div className="text-sm sm:text-2xl font-black font-mono text-slate-900">
                        ${Number(product.price).toFixed(2)}
                      </div>
                    </div>

                    <div className="flex items-center space-x-1.5 sm:space-x-2">
                      {/* Quantity Stepper */}
                      {!isOutOfStock && (
                        <div className="flex items-center border border-slate-200 bg-slate-50 rounded-lg sm:rounded-xl overflow-hidden">
                          <button
                            type="button"
                            onClick={() => handleQtyChange(product.id, selectedQty - 1, product.stock)}
                            className="p-1 sm:p-2 text-slate-600 hover:bg-slate-200 transition"
                            aria-label="Decrease quantity"
                          >
                            <Minus className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                          </button>
                          <span className="w-5 sm:w-7 text-center text-[10px] sm:text-xs font-bold text-slate-900">
                            {selectedQty}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleQtyChange(product.id, selectedQty + 1, product.stock)}
                            className="p-1 sm:p-2 text-slate-600 hover:bg-slate-200 transition"
                            aria-label="Increase quantity"
                          >
                            <Plus className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                          </button>
                        </div>
                      )}

                      {/* Add to Cart Button */}
                      <button
                        type="button"
                        disabled={isOutOfStock}
                        onClick={(e) => handleAdd(product, e)}
                        className={`flex-1 sm:flex-none px-2.5 py-1.5 sm:px-4 sm:py-2.5 rounded-lg sm:rounded-xl font-extrabold text-[10px] sm:text-xs transition active:scale-95 flex items-center justify-center space-x-1 shadow-sm ${
                          isOutOfStock
                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                            : 'bg-[#FACC15] hover:bg-yellow-400 text-slate-950 border border-yellow-400'
                        }`}
                      >
                        <ShoppingCart className="w-3 h-3 sm:w-3.5 sm:h-3.5 stroke-[2.5]" />
                        <span className="truncate">{user ? 'Add to Cart' : 'Order'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Mini Product Detail Modal */}
      {selectedProduct && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in"
          onClick={() => setSelectedProduct(null)}
        >
          <div
            className="relative w-full max-w-lg bg-white border border-slate-200 rounded-3xl shadow-2xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setSelectedProduct(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-2 rounded-xl hover:bg-slate-100 transition z-10"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Product Image Showcase */}
            <div className="relative w-full h-56 sm:h-72 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200">
              <img
                src={getProductImage(selectedProduct)}
                alt={selectedProduct.name}
                className="w-full h-full object-cover object-center"
              />
              <span className="absolute top-3 left-3 text-xs font-bold uppercase tracking-wider text-sky-800 bg-white/95 backdrop-blur-sm border border-slate-200 px-3 py-1 rounded-xl shadow-sm">
                {getCategory(selectedProduct)}
              </span>
              <span
                className={`absolute top-3 right-3 text-xs px-3 py-1 rounded-xl font-bold shadow-sm backdrop-blur-sm ${
                  selectedProduct.stock <= 0
                    ? 'bg-rose-50/95 text-rose-700 border border-rose-200'
                    : selectedProduct.stock < 10
                    ? 'bg-amber-50/95 text-amber-800 border border-amber-200'
                    : 'bg-emerald-50/95 text-emerald-800 border border-emerald-200'
                }`}
              >
                {selectedProduct.stock <= 0 ? 'Sold Out' : `${selectedProduct.stock} Available`}
              </span>
            </div>

            {/* Title & Price */}
            <div>
              <div className="text-[11px] font-mono text-slate-400 mb-1">
                Product SKU: #{selectedProduct.id.slice(0, 8)}
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 leading-snug">
                {selectedProduct.name}
              </h2>
              <div className="mt-2 text-2xl sm:text-3xl font-black font-mono text-[#0284C7]">
                ${Number(selectedProduct.price).toFixed(2)}
              </div>
            </div>

            {/* Detailed Description */}
            <div className="space-y-2 border-t border-slate-100 pt-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Description & Specs</h4>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {selectedProduct.description || 'Premium genuine hardware built to Fonu quality specifications with direct manufacturer guarantee.'}
              </p>
            </div>

            {/* Value Guarantees */}
            <div className="grid grid-cols-2 gap-3 py-3 border-y border-slate-100 text-[11px] text-slate-600">
              <div className="flex items-center space-x-2">
                <Truck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>Fast Nationwide Delivery</span>
              </div>
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-sky-600 flex-shrink-0" />
                <span>100% Authentic Guarantee</span>
              </div>
            </div>

            {/* Quantity Stepper & Add to Cart Action */}
            <div className="flex items-center space-x-3 pt-2">
              {selectedProduct.stock > 0 && (
                <div className="flex items-center border border-slate-200 bg-slate-50 rounded-2xl overflow-hidden p-1">
                  <button
                    type="button"
                    onClick={() =>
                      handleQtyChange(
                        selectedProduct.id,
                        (quantities[selectedProduct.id] || 1) - 1,
                        selectedProduct.stock
                      )
                    }
                    className="p-2 text-slate-600 hover:bg-slate-200 rounded-xl transition"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-8 text-center text-sm font-extrabold text-slate-900">
                    {quantities[selectedProduct.id] || 1}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      handleQtyChange(
                        selectedProduct.id,
                        (quantities[selectedProduct.id] || 1) + 1,
                        selectedProduct.stock
                      )
                    }
                    className="p-2 text-slate-600 hover:bg-slate-200 rounded-xl transition"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              )}

              <button
                type="button"
                disabled={selectedProduct.stock <= 0}
                onClick={(e) => {
                  handleAdd(selectedProduct, e);
                  setSelectedProduct(null);
                }}
                className={`flex-1 py-3.5 px-6 rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center space-x-2 transition shadow-sm active:scale-95 ${
                  selectedProduct.stock <= 0
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                    : 'bg-[#FACC15] hover:bg-yellow-400 text-slate-950 border border-yellow-400'
                }`}
              >
                <ShoppingCart className="w-4 h-4 stroke-[2.5]" />
                <span>{user ? 'Add to Cart' : 'Sign in to Order'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
