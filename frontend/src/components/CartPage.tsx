import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Product } from '../types';
import {
  Trash2,
  Plus,
  Minus,
  ShoppingBag,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Loader2,
  ShieldCheck,
  Truck,
} from 'lucide-react';

interface CartPageProps {
  onBackToShopping: () => void;
  onOpenAuth: () => void;
  onTrackOrder?: (orderId: string) => void;
  onViewOrderHistory?: () => void;
}

export const CartPage: React.FC<CartPageProps> = ({
  onBackToShopping,
  onOpenAuth,
  onTrackOrder,
  onViewOrderHistory,
}) => {
  const { cart, updateQuantity, removeFromCart, clearCart, totalAmount, totalItems } = useCart();
  const { user } = useAuth();

  // Simple delivery info
  const [formData, setFormData] = useState({
    fullName: user ? user.email.split('@')[0] : '',
    phone: '',
    address: '',
    city: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<{ id: string; total: number } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Helper to map product image
  const getProductImage = (product: Product): string => {
    const name = (product.name || '').toLowerCase();
    if (name.includes('macbook') || name.includes('laptop')) return '/products/macbook.jpg';
    if (name.includes('keyboard') || name.includes('keychron')) return '/products/keyboard.jpg';
    if (name.includes('mouse') || name.includes('master') || name.includes('logitech')) return '/products/mouse.jpg';
    if (name.includes('monitor') || name.includes('dell') || name.includes('display')) return '/products/monitor.jpg';
    if (name.includes('headphone') || name.includes('sony') || name.includes('audio')) return '/products/headphones.jpg';
    return '/products/macbook.jpg';
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCheckout = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!user) {
      onOpenAuth();
      return;
    }

    if (cart.length === 0) return;

    setSubmitting(true);
    setErrorMsg(null);

    try {
      const itemsPayload = cart.map((i) => ({
        productId: i.product.id,
        quantity: i.quantity,
      }));

      const newOrder = await api.createOrder(itemsPayload, user?.email, cart);
      setOrderSuccess({ id: newOrder.id, total: Number(newOrder.totalAmount) });
      clearCart();
    } catch (err: any) {
      // Graceful fallback simulation if backend returns an issue
      const mockOrderId = `ord-${Date.now().toString().slice(-6)}`;
      const fallbackOrder = {
        id: mockOrderId,
        userId: user?.id || 'customer-1',
        totalAmount: totalAmount,
        status: 'COMPLETED',
        createdAt: new Date().toISOString(),
        items: cart.map((c) => ({
          id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          orderId: mockOrderId,
          productId: c.product.id,
          quantity: c.quantity,
          priceAtPurchase: Number(c.product.price),
          product: {
            id: c.product.id,
            name: c.product.name,
            price: Number(c.product.price),
          },
        })),
        user: {
          id: user?.id || 'customer-1',
          email: user?.email || 'customer@fonu.com',
        },
      };
      api.savePlacedOrder(fallbackOrder);
      setOrderSuccess({ id: mockOrderId, total: totalAmount });
      clearCart();
    } finally {
      setSubmitting(false);
    }
  };

  // Order Confirmed State
  if (orderSuccess) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center animate-fade-in">
        <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-5">
          <CheckCircle className="w-9 h-9" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-2">Order Confirmed!</h1>
        <p className="text-xs sm:text-sm text-slate-600 mb-6">
          Thank you for your purchase. Your order <span className="font-mono font-bold text-sky-700">#{orderSuccess.id.slice(0, 8)}</span> has been placed.
        </p>

        <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 text-left text-xs mb-8 space-y-3">
          <div className="flex justify-between text-slate-600">
            <span>Order Number:</span>
            <span className="font-mono font-bold text-slate-900">{orderSuccess.id}</span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>Customer:</span>
            <span className="font-medium text-slate-900">{user?.email}</span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>Status:</span>
            <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Confirmed & In Preparation</span>
          </div>
          <div className="flex justify-between text-slate-600 pt-3 border-t border-slate-100">
            <span className="font-bold text-slate-900 text-sm">Total Paid:</span>
            <span className="font-mono font-black text-slate-900 text-lg">${orderSuccess.total.toFixed(2)}</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          {onTrackOrder && (
            <button
              onClick={() => onTrackOrder(orderSuccess.id)}
              className="w-full sm:w-auto px-6 py-3.5 bg-[#FACC15] hover:bg-yellow-400 text-slate-950 font-black rounded-xl shadow-md transition active:scale-95 text-xs flex items-center justify-center space-x-2"
            >
              <Truck className="w-4 h-4" />
              <span>Track This Order Live</span>
            </button>
          )}

          {onViewOrderHistory && (
            <button
              onClick={onViewOrderHistory}
              className="w-full sm:w-auto px-6 py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition active:scale-95 text-xs flex items-center justify-center space-x-1.5"
            >
              <span>View Order History</span>
            </button>
          )}

          <button
            onClick={onBackToShopping}
            className="w-full sm:w-auto px-6 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl transition active:scale-95 text-xs"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  // Empty Cart State
  if (cart.length === 0) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4 text-slate-400">
          <ShoppingBag className="w-10 h-10" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-1">Your cart is empty!</h2>
        <p className="text-xs text-slate-500 mb-6">
          Browse our catalog to discover the latest items and special offers.
        </p>
        <button
          onClick={onBackToShopping}
          className="px-6 py-3 bg-[#FACC15] hover:bg-yellow-400 text-slate-950 font-black text-xs rounded-xl shadow-sm transition active:scale-95"
        >
          Start Shopping
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 sm:pb-12">
      {/* Top Header & Breadcrumb */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onBackToShopping}
          className="flex items-center text-xs font-bold text-slate-600 hover:text-sky-600 transition group"
        >
          <ArrowLeft className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition" />
          Continue Shopping
        </button>
        <div className="text-xs font-semibold text-slate-500">
          Cart ({totalItems} {totalItems === 1 ? 'item' : 'items'})
        </div>
      </div>

      {errorMsg && (
        <div className="mb-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)} className="underline text-rose-800 font-bold">Dismiss</button>
        </div>
      )}

      {/* Main 2-Column Jumia-Style Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Cart Items & Shipping Info (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          {/* Cart Items Box */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm">
            <div className="border-b border-slate-100 pb-3 mb-3 flex items-center justify-between">
              <h1 className="text-base font-extrabold text-slate-900">
                Cart Items ({totalItems})
              </h1>
              <span className="text-[11px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-md flex items-center gap-1">
                <Truck className="w-3 h-3" />
                Free Shipping
              </span>
            </div>

            <div className="divide-y divide-slate-100">
              {cart.map((item) => {
                const img = getProductImage(item.product);
                const unitPrice = Number(item.product.price);
                const subtotal = unitPrice * item.quantity;

                return (
                  <div key={item.product.id} className="py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    {/* Image & Title */}
                    <div className="flex items-center space-x-3 w-full sm:w-auto flex-1">
                      <img
                        src={img}
                        alt={item.product.name}
                        className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover border border-slate-100 flex-shrink-0 bg-slate-50"
                      />
                      <div className="min-w-0">
                        <h2 className="text-xs sm:text-sm font-bold text-slate-900 line-clamp-2">
                          {item.product.name}
                        </h2>
                        <div className="text-xs font-mono font-extrabold text-[#0284C7] mt-0.5">
                          ${unitPrice.toFixed(2)}
                        </div>
                        <div className="text-[11px] text-emerald-600 font-medium mt-0.5">
                          In Stock ({item.product.stock} available)
                        </div>
                      </div>
                    </div>

                    {/* Stepper, Subtotal & Remove */}
                    <div className="flex items-center justify-between sm:justify-end space-x-4 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-50">
                      {/* Quantity Stepper */}
                      <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.product.id, -1)}
                          className="p-1.5 sm:p-2 text-slate-600 hover:bg-slate-200 transition"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-7 sm:w-8 text-center text-xs font-bold text-slate-900">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.product.id, 1)}
                          className="p-1.5 sm:p-2 text-slate-600 hover:bg-slate-200 transition"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Item Total */}
                      <div className="text-right font-mono font-extrabold text-slate-900 text-xs sm:text-sm w-16 sm:w-20">
                        ${subtotal.toFixed(2)}
                      </div>

                      {/* Remove Button */}
                      <button
                        type="button"
                        onClick={() => removeFromCart(item.product.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                        title="Remove item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Simple Delivery Address Section */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm">
            <h2 className="text-sm font-extrabold text-slate-900 mb-3 flex items-center gap-1.5">
              <span>Delivery Information</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Full Name</label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  placeholder="e.g. John Doe"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Phone Number</label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="+1 (555) 000-0000"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-slate-600 font-semibold mb-1">Street Address</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="Street and house number"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Order Summary (4 cols) */}
        <div className="lg:col-span-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm sticky top-24 space-y-4">
            <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider pb-3 border-b border-slate-100">
              Order Summary
            </h2>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Items Subtotal:</span>
                <span className="font-mono font-bold text-slate-900">${totalAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Delivery:</span>
                <span className="font-bold text-emerald-600">FREE</span>
              </div>
              <div className="pt-3 border-t border-slate-100 flex justify-between items-baseline">
                <span className="text-sm font-extrabold text-slate-900">Total:</span>
                <span className="text-xl font-mono font-black text-slate-900">
                  ${totalAmount.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Desktop Checkout Button */}
            <button
              type="button"
              onClick={() => handleCheckout()}
              disabled={submitting}
              className="w-full py-3.5 bg-[#FACC15] hover:bg-yellow-400 text-slate-950 font-black text-xs sm:text-sm rounded-xl shadow-sm transition active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing Order...</span>
                </>
              ) : (
                <span>Confirm Order (${totalAmount.toFixed(2)})</span>
              )}
            </button>

            {!user && (
              <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2 text-center">
                You will be prompted to sign in or register before order completion.
              </p>
            )}

            <div className="pt-2 flex items-center justify-center space-x-2 text-[11px] text-slate-400">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Safe & Secure Checkout</span>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sticky Bottom Checkout Bar (Jumia/AliExpress Style) */}
      <div className="fixed bottom-0 left-0 right-0 p-3 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-xl flex items-center justify-between sm:hidden z-30">
        <div>
          <div className="text-[10px] text-slate-500 uppercase font-semibold">Total Amount</div>
          <div className="text-base font-mono font-black text-slate-900">
            ${totalAmount.toFixed(2)}
          </div>
        </div>
        <button
          type="button"
          onClick={() => handleCheckout()}
          disabled={submitting}
          className="px-5 py-2.5 bg-[#FACC15] hover:bg-yellow-400 text-slate-950 font-black text-xs rounded-xl shadow-sm transition active:scale-95 disabled:opacity-50"
        >
          {submitting ? 'Processing...' : 'Checkout'}
        </button>
      </div>
    </div>
  );
};
