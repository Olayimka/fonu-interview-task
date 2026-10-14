import React, { useState, useEffect } from 'react';
import { Order, Product } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { TrackOrderModal } from './TrackOrderModal';
import {
  Clock,
  Package,
  Truck,
  Search,
  Filter,
  RefreshCw,
  ShoppingBag,
  ArrowRight,
  AlertCircle,
  CheckCircle,
  XCircle,
  ChevronRight,
  ShieldCheck,
  Calendar,
} from 'lucide-react';

interface OrderHistoryViewProps {
  onBackToShopping: () => void;
  onOpenAuth: () => void;
  initialTrackingOrderId?: string | null;
}

export const OrderHistoryView: React.FC<OrderHistoryViewProps> = ({
  onBackToShopping,
  onOpenAuth,
  initialTrackingOrderId = null,
}) => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED'>('ALL');
  const [trackOrderIdInput, setTrackOrderIdInput] = useState('');
  const [selectedTrackingOrderId, setSelectedTrackingOrderId] = useState<string | null>(initialTrackingOrderId);

  // Notification banners
  const [actionAlert, setActionAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null);

  const getProductImage = (productName?: string): string => {
    const text = (productName || '').toLowerCase();
    if (text.includes('macbook') || text.includes('laptop')) return '/products/macbook.jpg';
    if (text.includes('keyboard') || text.includes('keychron')) return '/products/keyboard.jpg';
    if (text.includes('mouse') || text.includes('logitech')) return '/products/mouse.jpg';
    if (text.includes('monitor') || text.includes('dell')) return '/products/monitor.jpg';
    if (text.includes('headphone') || text.includes('sony')) return '/products/headphones.jpg';
    return '/products/macbook.jpg';
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const data = await api.getOrders();
      setOrders(data);
    } catch (err: any) {
      console.warn('Orders fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [user]);

  const handleCancelOrder = async (orderId: string) => {
    if (!confirm(`Are you sure you want to cancel order #${orderId}? Your order total will be refunded and inventory replenished.`)) {
      return;
    }

    setCancellingOrderId(orderId);
    try {
      await api.updateOrderStatus(orderId, 'CANCELLED');
      setActionAlert({
        type: 'success',
        message: `Order #${orderId.slice(0, 8)} has been cancelled. Inventory units have been restored.`,
      });
      await fetchOrders();
    } catch (err: any) {
      setActionAlert({
        type: 'error',
        message: err.message || 'Failed to cancel order.',
      });
    } finally {
      setCancellingOrderId(null);
    }
  };

  const handleDirectTrack = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackOrderIdInput.trim()) return;
    setSelectedTrackingOrderId(trackOrderIdInput.trim());
  };

  // Filter orders
  const filteredOrders = orders.filter((order) => {
    // Status filter
    const currentStatus = (order.status || 'PROCESSING').toUpperCase();
    if (statusFilter !== 'ALL') {
      if (statusFilter === 'DELIVERED' && (currentStatus === 'DELIVERED' || currentStatus === 'COMPLETED')) {
        // match
      } else if (currentStatus !== statusFilter) {
        return false;
      }
    }

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchId = order.id.toLowerCase().includes(q);
      const matchItems = (order.items || []).some((it) =>
        (it.product?.name || '').toLowerCase().includes(q),
      );
      return matchId || matchItems;
    }

    return true;
  });

  const getStatusBadge = (status: string) => {
    const s = (status || 'PROCESSING').toUpperCase();
    switch (s) {
      case 'DELIVERED':
      case 'COMPLETED':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
            <CheckCircle className="w-3 h-3 text-emerald-600" />
            <span>Delivered</span>
          </span>
        );
      case 'SHIPPED':
      case 'OUT_FOR_DELIVERY':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-sky-100 text-sky-800 border border-sky-300 flex items-center gap-1">
            <Truck className="w-3 h-3 text-sky-600" />
            <span>In Transit</span>
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-300 flex items-center gap-1">
            <XCircle className="w-3 h-3 text-rose-600" />
            <span>Cancelled</span>
          </span>
        );
      case 'PENDING':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-300 flex items-center gap-1">
            <Clock className="w-3 h-3 text-slate-500" />
            <span>Pending</span>
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
            <Clock className="w-3 h-3 text-amber-600" />
            <span>Processing</span>
          </span>
        );
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in text-slate-900">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="flex items-center space-x-2 text-xs text-slate-500 mb-1">
            <button onClick={onBackToShopping} className="hover:text-slate-900 transition">
              Home
            </button>
            <span>/</span>
            <span className="text-slate-900 font-bold">Order History & Tracking</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Package className="w-7 h-7 text-[#EAB308]" />
            <span>Order History & Tracking</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            View your order history, track live shipments, and inspect receipts
          </p>
        </div>

        {/* Quick Track Order Search Box */}
        <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-sm max-w-md w-full">
          <form onSubmit={handleDirectTrack} className="flex items-center space-x-2">
            <div className="relative flex-1">
              <Truck className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={trackOrderIdInput}
                onChange={(e) => setTrackOrderIdInput(e.target.value)}
                placeholder="Track by Order # (e.g. ord-123)..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-sky-500"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-[#FACC15] hover:bg-yellow-400 text-slate-950 font-black text-xs rounded-xl shadow-xs transition active:scale-95 flex items-center space-x-1"
            >
              <span>Track</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>

      {/* Action Notification Alert */}
      {actionAlert && (
        <div
          className={`p-4 rounded-2xl border flex items-center justify-between text-xs animate-fade-in ${
            actionAlert.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
              : 'bg-rose-50 text-rose-900 border-rose-200'
          }`}
        >
          <div className="flex items-center space-x-2 font-bold">
            {actionAlert.type === 'success' ? (
              <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            )}
            <span>{actionAlert.message}</span>
          </div>
          <button
            onClick={() => setActionAlert(null)}
            className="text-[11px] underline font-bold ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Search & Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by order ID or item..."
            className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-sky-500 text-xs"
          />
        </div>

        {/* Status Filter Chips */}
        <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
          {(['ALL', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl font-bold transition text-[11px] border ${
                statusFilter === st
                  ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              {st === 'ALL' ? 'All Orders' : st}
            </button>
          ))}
          <button
            onClick={fetchOrders}
            className="p-2 text-slate-500 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition ml-1"
            title="Refresh orders"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Orders List Container */}
      {loading ? (
        <div className="py-24 text-center bg-white rounded-3xl border border-slate-200 shadow-sm space-y-3">
          <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-bold text-slate-600">Retrieving order history...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="py-20 text-center bg-white rounded-3xl border border-slate-200 shadow-sm p-8 space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <div>
            <h3 className="font-extrabold text-base text-slate-900">No orders found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {searchQuery || statusFilter !== 'ALL'
                ? 'Try adjusting your search query or filter settings.'
                : 'You have not placed any orders yet. Explore our store inventory to get started!'}
            </p>
          </div>
          <button
            onClick={onBackToShopping}
            className="px-6 py-3 bg-[#FACC15] hover:bg-yellow-400 text-slate-950 font-black text-xs rounded-xl shadow-sm transition active:scale-95 inline-flex items-center space-x-2"
          >
            <span>Browse Products</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          {filteredOrders.map((order) => {
            const isCancellable = order.status === 'PENDING' || order.status === 'PROCESSING';

            return (
              <div
                key={order.id}
                className="bg-white rounded-3xl border border-slate-200 shadow-sm hover:border-slate-300 transition overflow-hidden"
              >
                {/* Order Top Bar */}
                <div className="p-4 sm:p-5 bg-slate-50/80 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="flex flex-wrap items-center gap-3">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">
                        Order Placed
                      </span>
                      <span className="font-medium text-slate-700 flex items-center gap-1 mt-0.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {new Date(order.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                    </div>

                    <div className="h-7 w-[1px] bg-slate-200 hidden sm:block" />

                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">
                        Order ID
                      </span>
                      <span className="font-mono font-bold text-slate-900 block mt-0.5">
                        #{order.id.slice(0, 10)}
                      </span>
                    </div>

                    <div className="h-7 w-[1px] bg-slate-200 hidden sm:block" />

                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">
                        Total Amount
                      </span>
                      <span className="font-mono font-black text-slate-900 text-sm block">
                        ${Number(order.totalAmount).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div>{getStatusBadge(order.status)}</div>
                </div>

                {/* Items in this Order */}
                <div className="p-4 sm:p-6 divide-y divide-slate-100">
                  {order.items && order.items.length > 0 ? (
                    order.items.map((it) => (
                      <div
                        key={it.id || it.productId}
                        className="py-3.5 first:pt-0 last:pb-0 flex items-center justify-between text-xs gap-3"
                      >
                        <div className="flex items-center space-x-3.5 flex-1 min-w-0">
                          <img
                            src={getProductImage(it.product?.name)}
                            alt={it.product?.name || 'Product'}
                            className="w-12 h-12 rounded-xl object-cover border border-slate-200 flex-shrink-0"
                          />
                          <div className="min-w-0 flex-1">
                            <h4 className="font-bold text-slate-900 truncate text-xs sm:text-sm">
                              {it.product?.name || 'Item'}
                            </h4>
                            <p className="text-slate-500 text-[11px] font-mono mt-0.5">
                              Quantity: <span className="font-bold text-slate-800">{it.quantity}</span> × $
                              {Number(it.priceAtPurchase).toFixed(2)}
                            </p>
                          </div>
                        </div>

                        <div className="text-right font-mono font-black text-slate-900 text-sm">
                          ${(Number(it.priceAtPurchase) * it.quantity).toFixed(2)}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-4 text-slate-500 text-xs italic">
                      Standard hardware package (1 unit)
                    </div>
                  )}
                </div>

                {/* Order Footer Actions */}
                <div className="p-4 sm:p-5 bg-slate-50/50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                  <div className="flex items-center space-x-1.5 text-slate-500 text-[11px]">
                    <ShieldCheck className="w-3.5 h-3.5 text-sky-600" />
                    <span>Fulfilled with Fonu Express Priority Logistics</span>
                  </div>

                  <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
                    {/* Cancellation Action if applicable */}
                    {isCancellable && (
                      <button
                        onClick={() => handleCancelOrder(order.id)}
                        disabled={cancellingOrderId === order.id}
                        className="px-3.5 py-2 text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl font-bold transition text-xs disabled:opacity-50"
                      >
                        {cancellingOrderId === order.id ? 'Cancelling...' : 'Cancel Order'}
                      </button>
                    )}

                    {/* Track Order Button */}
                    <button
                      onClick={() => setSelectedTrackingOrderId(order.id)}
                      className="px-4 py-2 bg-[#FACC15] hover:bg-yellow-400 text-slate-950 font-black rounded-xl shadow-xs transition active:scale-95 flex items-center space-x-1.5 text-xs"
                    >
                      <Truck className="w-3.5 h-3.5" />
                      <span>Track Shipment</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Standalone Tracking Modal */}
      <TrackOrderModal
        orderId={selectedTrackingOrderId}
        onClose={() => setSelectedTrackingOrderId(null)}
      />
    </div>
  );
};
