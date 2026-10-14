import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { InventoryView } from './components/InventoryView';
import { CartPage } from './components/CartPage';
import { AdminDashboard } from './components/AdminDashboard';
import { AuthModal } from './components/AuthModal';
import { Footer } from './components/Footer';
import { Product } from './types';
import { api } from './services/api';
import {
  Shield,
  ShoppingCart,
  ArrowRight,
  Store,
} from 'lucide-react';

export const AppContent: React.FC = () => {
  const { user, isLoading, quickLoginAsCustomer } = useAuth();
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [currentView, setCurrentView] = useState<'home' | 'inventory' | 'cart' | 'dashboard'>('home');
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  const fallbackCatalog: Product[] = [
    {
      id: 'demo-1',
      name: 'MacBook Pro 16" M3 Max',
      description: 'Apple M3 Max chip with 16-core CPU, 36GB unified memory, and Liquid Retina XDR display.',
      price: 3499.00,
      stock: 12,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'demo-2',
      name: 'Keychron Q1 Pro Wireless Keyboard',
      description: 'Custom mechanical keyboard with QMK/VIA support, hot-swappable switches, and CNC aluminum body.',
      price: 199.99,
      stock: 24,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'demo-3',
      name: 'Logitech MX Master 3S Mouse',
      description: 'Ergonomic performance wireless mouse with 8K DPI sensor, Quiet Clicks, and MagSpeed wheel.',
      price: 99.99,
      stock: 35,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'demo-4',
      name: 'Dell UltraSharp 34" Curved Monitor',
      description: 'WQHD 3440x1440 curved IPS panel with 90W USB-C power delivery and RJ45 Ethernet.',
      price: 749.99,
      stock: 8,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'demo-5',
      name: 'Sony WH-1000XM5 Wireless Headphones',
      description: 'Industry-leading noise canceling wireless headphones with two processors and 30-hour battery life.',
      price: 399.99,
      stock: 18,
      createdAt: new Date().toISOString(),
    },
  ];

  useEffect(() => {
    api
      .getProducts()
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setProducts(data);
        } else {
          setProducts(fallbackCatalog);
        }
      })
      .catch(() => {
        setProducts(fallbackCatalog);
      })
      .finally(() => setLoadingProducts(false));
  }, []);

  // When a user logs in as Admin, default to dashboard
  useEffect(() => {
    if (user?.role === 'ADMIN') {
      setCurrentView('dashboard');
    }
  }, [user]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] text-slate-900">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-10 h-10 border-3 border-[#EAB308] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-bold text-slate-600">Loading Fonu Shop...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col font-sans">
      <Navbar
        onOpenAuth={() => setIsAuthOpen(true)}
        onGoToHome={() => setCurrentView('home')}
        onGoToInventory={() => setCurrentView('inventory')}
        onGoToCart={() => setCurrentView('cart')}
        currentView={currentView === 'dashboard' ? 'home' : currentView}
      />

      <main className="flex-1 w-full">
        {/* If Admin view is active */}
        {user?.role === 'ADMIN' && currentView === 'dashboard' ? (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* First div: ONLY Admin Portal with icon */}
            <div className="mb-6 p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 border border-amber-300 flex items-center justify-center">
                <Shield className="w-5 h-5 text-amber-600" />
              </div>
              <h1 className="text-base font-extrabold text-slate-900">
                Admin Portal
              </h1>
            </div>


            <AdminDashboard />
          </div>
        ) : currentView === 'cart' ? (
          /* Dedicated Jumia-style Cart View */
          <CartPage
            onBackToShopping={() => setCurrentView('inventory')}
            onOpenAuth={() => setIsAuthOpen(true)}
          />
        ) : currentView === 'inventory' ? (
          /* Dedicated 2-Column Inventory Catalog View */
          <InventoryView
            products={products}
            loading={loadingProducts}
            onBackToHome={() => setCurrentView('home')}
            onOpenAuth={() => setIsAuthOpen(true)}
            onGoToCart={() => setCurrentView('cart')}
          />
        ) : (
          /* Clean, Uncluttered Landing Page Hero */
          <div className="w-full">
            <div className="relative min-h-[560px] sm:min-h-[640px] flex items-center justify-center overflow-hidden">
              {/* Shopping Hero Image with black woman shopping */}
              <div className="absolute inset-0 z-0">
                <img
                  src="/hero-shopping.jpg"
                  alt="Shopping cart at Fonu Shop"
                  className="w-full h-full object-cover object-center"
                />
                {/* Crisp dark overlay to make hero copy and buttons high contrast */}
                <div className="absolute inset-0 bg-slate-950/70" />
              </div>

              {/* Hero Center Content */}
              <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center space-y-6">
                <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-tight">
                  Welcome to{' '}
                  <span className="text-[#FACC15]">Fonu</span>{' '}
                  <span className="text-[#38BDF8]">Shop</span>
                </h1>

                <p className="text-sm sm:text-base text-slate-200 max-w-lg mx-auto leading-relaxed">
                  Discover top-tier tech, accessories, and gear with instant checkout, live stock updates, and guaranteed delivery.
                </p>

                {/* Primary High-Contrast Buttons */}
                <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4 max-w-sm mx-auto">
                  {/* High contrast, prominent Get Started button */}
                  <button
                    onClick={() => {
                      if (user) {
                        setCurrentView('inventory');
                      } else {
                        setIsAuthOpen(true);
                      }
                    }}
                    className="w-full sm:w-auto px-8 py-3.5 bg-[#FACC15] hover:bg-yellow-400 text-slate-950 font-black text-sm rounded-xl shadow-lg border border-yellow-300 transition active:scale-95 flex items-center justify-center space-x-2"
                  >
                    <span>Get Started</span>
                    <ArrowRight className="w-4 h-4 stroke-[3]" />
                  </button>

                  {/* Explore Inventory button */}
                  <button
                    onClick={() => setCurrentView('inventory')}
                    className="w-full sm:w-auto px-8 py-3.5 bg-white/10 hover:bg-white/20 text-white font-bold text-sm rounded-xl border border-white/30 backdrop-blur-sm transition active:scale-95 flex items-center justify-center space-x-2"
                  >
                    <ShoppingCart className="w-4 h-4 text-[#FACC15]" />
                    <span>Explore Inventory</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Short, elegant e-commerce footer */}
      <Footer />

      {/* Auth Modal */}
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
    </div>
  );
};

export const App: React.FC = () => {
  return <AppContent />;
};
export default App;
