import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product, CartItem } from '../types';

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: Product, quantity?: number, event?: React.MouseEvent) => void;
  updateQuantity: (productId: string, delta: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  totalAmount: number;
  totalItems: number;
  isCartBouncing: boolean;
  flyingBasket: { id: number; x: number; y: number } | null;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('fonu_cart_items');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isCartBouncing, setIsCartBouncing] = useState(false);
  const [flyingBasket, setFlyingBasket] = useState<{ id: number; x: number; y: number } | null>(null);

  useEffect(() => {
    localStorage.setItem('fonu_cart_items', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (product: Product, quantity = 1, event?: React.MouseEvent) => {
    // Trigger flying cart basket animation from click location
    if (event) {
      const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;
      setFlyingBasket({ id: Date.now(), x, y });

      setTimeout(() => {
        setFlyingBasket(null);
        // Bounce the navbar cart icon when the flying basket arrives
        setIsCartBouncing(true);
        setTimeout(() => setIsCartBouncing(false), 500);
      }, 700);
    } else {
      setIsCartBouncing(true);
      setTimeout(() => setIsCartBouncing(false), 500);
    }

    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        const nextQty = Math.min(existing.quantity + quantity, product.stock);
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: nextQty } : item,
        );
      }
      return [...prev, { product, quantity }];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
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

  const clearCart = () => {
    setCart([]);
  };

  const totalAmount = cart.reduce(
    (sum, item) => sum + Number(item.product.price) * item.quantity,
    0,
  );

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        totalAmount,
        totalItems,
        isCartBouncing,
        flyingBasket,
      }}
    >
      {children}
      {/* Animated Flying Shopping Cart Basket */}
      {flyingBasket && (
        <div
          className="fixed pointer-events-none z-50 transition-all duration-700 ease-out"
          style={{
            left: flyingBasket.x,
            top: flyingBasket.y,
            transform: 'translate(-50%, -50%)',
            animation: 'flyToCart 0.75s cubic-bezier(0.2, 0.9, 0.3, 1) forwards',
          }}
        >
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-neon-yellow text-slate-950 font-bold shadow-2xl shadow-neon-yellow/60 border-2 border-white scale-110">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-5 h-5">
              <circle cx="8" cy="21" r="1" />
              <circle cx="19" cy="21" r="1" />
              <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
            </svg>
          </div>
        </div>
      )}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
