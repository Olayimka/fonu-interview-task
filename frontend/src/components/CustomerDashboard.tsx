import React, { useState, useEffect } from 'react';
import { Product, Order, CartItem } from '../types';
import { api } from '../services/api';
import {
  ShoppingCart,
  Package,
  Clock,
  Plus,
  Minus,
  Trash2,
  CheckCircle,
  AlertCircle,
  Loader2,
  RefreshCw,
  ShoppingBag,
} from 'lucide-react';

export const CustomerDashboard: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [quantities, setQuantities] = useState<{ [productId: string]: number }>({});

  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [ordering, setOrdering] = useState(false);

  // Notifications / Alerts
  const [errorAlert, setErrorAlert] = useState<string | null>(null);
  const [successAlert, setSuccessAlert] = useState<string | null>(null);

  useEffect(() => {
    fetchProducts();
    fetchOrders();
  }, []);

  const fallbackCatalog: Product[] = [
    {
      id: 'demo-1',
      name: 'MacBook Pro 16" M3 Max',
      description: 'Apple M3 Max chip with 16-core CPU, 36GB RAM, 1TB SSD Liquid Retina display.',
      price: 3499.00,
      stock: 15,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'demo-2',
      name: 'Keychron Q1 Pro Wireless Keyboard',
      description: 'Custom mechanical keyboard with QMK/VIA support, hot-swappable switches, aluminum body.',
      price: 199.99,
      stock: 45,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'demo-3',
      name: 'Logitech MX Master 3S Mouse',
      description: 'Ergonomic performance wireless mouse with 8K DPI sensor and quiet electromagnetic wheel.',
      price: 99.99,
      stock: 60,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'demo-4',
      name: 'Dell UltraSharp 32" 4K Monitor',
      description: 'U3224KB 4K HDR IPS Black panel with built-in 4K webcam and Thunderbolt 4 hub.',
      price: 899.50,
      stock: 20,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'demo-5',
      name: 'Sony WH-1000XM5 Headphones',
      description: 'Industry-leading noise canceling wireless headphones with Auto NC Optimizer.',
      price: 398.00,
      stock: 35,
      createdAt: new Date().toISOString(),
    },
  ];

  const fetchProducts = async () => {
    try {
      setLoadingProducts(true);
      const data = await api.getProducts();
      if (Array.isArray(data) && data.length > 0) {
        setProducts(data);
      } else {
        setProducts(fallbackCatalog);
      }
    } catch (err: any) {
      setProducts(fallbackCatalog);
    } finally {
      setLoadingProducts(false);
    }
  };

  const fetchOrders = async () => {
    try {
      setLoadingOrders(true);
      const data = await api.getOrders();
      setOrders(data);
    } catch (err: any) {
      setErrorAlert(`Failed to load your orders: ${err.message}`);
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleQuantityChange = (productId: string, val: number, maxStock: number) => {
    const nextVal = Math.max(1, Math.min(val, maxStock));
    setQuantities((prev) => ({ ...prev, [productId]: nextVal }));
  };

  const addToCart = (product: Product) => {
    const qty = quantities[product.id] || 1;
    if (product.stock < qty) {
      setErrorAlert(`Cannot add ${qty} units. Only ${product.stock} available in stock.`);
      return;
    }

    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        const newQty = Math.min(existing.quantity + qty, product.stock);
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: newQty } : item,
        );
      }
      return [...prev, { product, quantity: qty }];
    });

    setSuccessAlert(`Added ${qty} × "${product.name}" to cart`);
    setTimeout(() => setSuccessAlert(null), 3000);
  };

  const updateCartQty = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId) {
            const next = item.quantity + delta;
            return next > 0 && next <= item.product.stock ? { ...item, quantity: next } : item;
          }
          return item;
        })
        .filter((item) => item.quantity > 0),
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const cartTotal = cart.reduce(
    (sum, item) => sum + Number(item.product.price) * item.quantity,
    0,
  );

  const handlePlaceOrder = async () => {
    if (cart.length === 0) return;
    setErrorAlert(null);
    setSuccessAlert(null);
    setOrdering(true);

    try {
      const itemsPayload = cart.map((item) => ({
        productId: item.product.id,
        quantity: item.quantity,
      }));

      const newOrder = await api.createOrder(itemsPayload);
      setSuccessAlert(
        `🎉 Order #${newOrder.id.slice(0, 8)} successfully placed! Total: $${Number(newOrder.totalAmount).toFixed(2)}`,
      );
      setCart([]); // Clear cart

      // Refresh product stock and order history
      await Promise.all([fetchProducts(), fetchOrders()]);
    } catch (err: any) {
      setErrorAlert(err.message || 'Failed to place order. Backend rejected request.');
    } finally {
      setOrdering(false);
    }
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Notifications Banner */}
      {errorAlert && (
        <div className="flex items-center justify-between p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm animate-fade-in">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{errorAlert}</span>
          </div>
          <button
            onClick={() => setErrorAlert(null)}
            className="text-xs hover:underline text-rose-300 ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      {successAlert && (
        <div className="flex items-center justify-between p-4 rounded-2xl bg-yellow-400/10 border border-yellow-400/20 text-yellow-300 text-sm animate-fade-in">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
            <span>{successAlert}</span>
          </div>
          <button
            onClick={() => setSuccessAlert(null)}
            className="text-xs hover:underline text-yellow-300 ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Grid: Catalog (Left) + Cart Sidebar (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Products Catalog (Cols 1 & 2) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
                <Package className="w-5 h-5 text-yellow-400" />
                Product Catalog
              </h2>
              <p className="text-xs text-blue-200/70 mt-0.5">
                Browse inventory and add items to your shopping cart
              </p>
            </div>
            <button
              onClick={fetchProducts}
              disabled={loadingProducts}
              className="p-2 text-slate-400 hover:text-white bg-blue-950/60 border border-blue-900/40 rounded-xl hover:bg-blue-900/60 transition"
              title="Refresh Catalog"
            >
              <RefreshCw className={`w-4 h-4 ${loadingProducts ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {loadingProducts ? (
            <div className="flex flex-col items-center justify-center p-16 glass-panel rounded-3xl">
              <Loader2 className="w-8 h-8 animate-spin text-yellow-400 mb-2" />
              <p className="text-xs text-blue-200/70">Loading available products...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="p-12 text-center glass-panel rounded-3xl">
              <Package className="w-12 h-12 text-blue-900 mx-auto mb-3" />
              <p className="text-blue-200/70 text-sm">No products in inventory yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {products.map((product) => {
                const selectedQty = quantities[product.id] || 1;
                const isOutOfStock = product.stock <= 0;

                return (
                  <div
                    key={product.id}
                    className="glass-card rounded-2xl p-5 flex flex-col justify-between hover:border-yellow-400/40 transition group"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="font-bold text-white group-hover:text-yellow-400 transition text-base">
                          {product.name}
                        </h3>
                        <span
                          className={`text-xs px-2.5 py-0.5 rounded-full font-mono font-bold whitespace-nowrap ${
                            isOutOfStock
                              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                              : product.stock < 10
                              ? 'bg-yellow-400/10 text-yellow-400 border border-yellow-400/20'
                              : 'bg-blue-500/10 text-blue-300 border border-blue-500/20'
                          }`}
                        >
                          {isOutOfStock ? 'Out of Stock' : `${product.stock} in stock`}
                        </span>
                      </div>

                      {product.description && (
                        <p className="text-xs text-blue-100/70 line-clamp-2 mb-4 leading-relaxed">
                          {product.description}
                        </p>
                      )}
                    </div>

                    <div className="pt-4 border-t border-blue-900/40">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-xl font-extrabold font-mono text-yellow-400">
                          ${Number(product.price).toFixed(2)}
                        </span>

                        {/* Quantity Selector */}
                        {!isOutOfStock && (
                          <div className="flex items-center bg-[#070e20] border border-blue-900/60 rounded-xl overflow-hidden">
                            <button
                              type="button"
                              onClick={() =>
                                handleQuantityChange(product.id, selectedQty - 1, product.stock)
                              }
                              className="p-1.5 text-blue-300 hover:text-white hover:bg-blue-900/60 transition"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="w-8 text-center text-xs font-mono font-bold text-slate-100">
                              {selectedQty}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                handleQuantityChange(product.id, selectedQty + 1, product.stock)
                              }
                              className="p-1.5 text-blue-300 hover:text-white hover:bg-blue-900/60 transition"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => addToCart(product)}
                        disabled={isOutOfStock}
                        className="w-full py-2.5 px-3 bg-yellow-400 hover:bg-yellow-300 disabled:opacity-40 disabled:pointer-events-none active:scale-[0.98] text-slate-950 font-bold text-xs rounded-xl flex items-center justify-center space-x-1.5 shadow-md shadow-yellow-500/20 transition"
                      >
                        <ShoppingCart className="w-3.5 h-3.5" />
                        <span>{isOutOfStock ? 'Sold Out' : 'Add to Cart'}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Cart Sidebar (Col 3) */}
        <div id="cart-section" className="space-y-6">
          <div className="glass-panel rounded-3xl p-6 sticky top-24">
            <h2 className="text-lg font-extrabold text-white flex items-center gap-2 mb-4">
              <ShoppingCart className="w-5 h-5 text-yellow-400" />
              Shopping Cart
              {cart.length > 0 && (
                <span className="text-xs bg-yellow-400 text-slate-950 font-bold font-mono px-2 py-0.5 rounded-full ml-auto">
                  {cart.reduce((c, i) => c + i.quantity, 0)} items
                </span>
              )}
            </h2>

            {cart.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-blue-900/50 rounded-2xl my-4">
                <ShoppingBag className="w-10 h-10 text-blue-900 mx-auto mb-2" />
                <p className="text-xs text-blue-200/80 font-medium">Your cart is currently empty.</p>
                <p className="text-[11px] text-blue-300/50 mt-1">Select items from the catalog.</p>
              </div>
            ) : (
              <div className="space-y-3 my-4 max-h-[380px] overflow-y-auto pr-1">
                {cart.map((item) => (
                  <div
                    key={item.product.id}
                    className="p-3.5 bg-blue-950/60 border border-blue-900/40 rounded-2xl flex items-center justify-between text-xs"
                  >
                    <div className="flex-1 pr-2">
                      <div className="font-bold text-white truncate">{item.product.name}</div>
                      <div className="text-yellow-400 font-mono text-[11px] font-semibold mt-0.5">
                        ${Number(item.product.price).toFixed(2)} × {item.quantity} = $
                        {(Number(item.product.price) * item.quantity).toFixed(2)}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <div className="flex items-center bg-[#070e20] border border-blue-900/60 rounded-lg">
                        <button
                          onClick={() => updateCartQty(item.product.id, -1)}
                          className="p-1 text-blue-300 hover:text-white"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-2 font-mono font-bold">{item.quantity}</span>
                        <button
                          onClick={() => updateCartQty(item.product.id, 1)}
                          className="p-1 text-blue-300 hover:text-white"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <button
                        onClick={() => removeFromCart(item.product.id)}
                        className="text-slate-400 hover:text-rose-400 p-1"
                        title="Remove"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Cart Summary & Order Action */}
            <div className="pt-4 border-t border-blue-900/40 space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-blue-200/70 font-medium">Order Total:</span>
                <span className="text-2xl font-extrabold font-mono text-yellow-400">
                  ${cartTotal.toFixed(2)}
                </span>
              </div>

              <button
                onClick={handlePlaceOrder}
                disabled={cart.length === 0 || ordering}
                className="w-full py-3.5 px-4 bg-yellow-400 hover:bg-yellow-300 active:scale-[0.99] disabled:opacity-50 text-slate-950 font-extrabold text-sm rounded-xl flex items-center justify-center space-x-2 shadow-lg shadow-yellow-500/20 transition"
              >
                {ordering ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processing Order...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    <span>Place Order</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Customer Order History Section */}
      <div className="space-y-4 pt-6 border-t border-blue-950">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-400" />
              Your Order History
            </h2>
            <p className="text-xs text-blue-200/70 mt-0.5">
              Review personal historical orders and fulfillment status
            </p>
          </div>
          <button
            onClick={fetchOrders}
            disabled={loadingOrders}
            className="p-2 text-slate-400 hover:text-white bg-blue-950/60 border border-blue-900/40 rounded-xl hover:bg-blue-900/60 transition"
          >
            <RefreshCw className={`w-4 h-4 ${loadingOrders ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {loadingOrders ? (
          <div className="flex justify-center p-8">
            <Loader2 className="w-6 h-6 animate-spin text-yellow-400" />
          </div>
        ) : orders.length === 0 ? (
          <div className="p-8 text-center glass-panel rounded-3xl">
            <Clock className="w-10 h-10 text-blue-900 mx-auto mb-2" />
            <p className="text-blue-200/70 text-xs">You haven't placed any orders yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {orders.map((order) => (
              <div key={order.id} className="glass-card rounded-2xl p-5 border border-blue-900/40">
                <div className="flex items-center justify-between mb-3 pb-3 border-b border-blue-900/40">
                  <div>
                    <span className="text-xs font-mono text-yellow-400 font-bold">
                      Order #{order.id.slice(0, 8)}
                    </span>
                    <div className="text-[11px] text-blue-300/60">
                      {new Date(order.createdAt).toLocaleString()}
                    </div>
                  </div>
                  <span className="text-xs px-2.5 py-0.5 bg-yellow-400/10 text-yellow-400 border border-yellow-400/20 font-bold rounded-full font-mono">
                    {order.status}
                  </span>
                </div>

                {/* Items breakdown */}
                <div className="space-y-1.5 mb-3">
                  {order.items?.map((item) => (
                    <div
                      key={item.id}
                      className="flex justify-between items-center text-xs text-slate-200"
                    >
                      <span className="truncate pr-2">
                        {item.quantity} × {item.product?.name || 'Product'}
                      </span>
                      <span className="font-mono text-blue-300 font-semibold">
                        ${(Number(item.priceAtPurchase) * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-blue-900/40 font-bold text-sm">
                  <span className="text-blue-200/70 text-xs font-medium">Total:</span>
                  <span className="font-mono text-yellow-400 text-base">
                    ${Number(order.totalAmount).toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
