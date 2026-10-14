import React, { useState, useEffect } from 'react';
import { Product, Order, AnalyticsData } from '../types';
import { api } from '../services/api';
import {
  DollarSign,
  Package,
  ShoppingCart,
  TrendingUp,
  Plus,
  Edit2,
  Trash2,
  RefreshCw,
  Loader2,
  AlertCircle,
  CheckCircle,
  X,
  FileSpreadsheet,
  Upload,
  Image as ImageIcon,
  Truck,
  Search,
} from 'lucide-react';
import { TrackOrderModal } from './TrackOrderModal';

export const AdminDashboard: React.FC = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  const [loadingAnalytics, setLoadingAnalytics] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingOrders, setLoadingOrders] = useState(true);

  // Notifications
  const [errorAlert, setErrorAlert] = useState<string | null>(null);
  const [successAlert, setSuccessAlert] = useState<string | null>(null);

  // Orders Ledger Controls
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<'ALL' | 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED'>('ALL');
  const [selectedTrackingOrderId, setSelectedTrackingOrderId] = useState<string | null>(null);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  // Product Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formPrice, setFormPrice] = useState('');
  const [formStock, setFormStock] = useState('');
  const [formImageUrl, setFormImageUrl] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);

  const imagePresets = [
    { label: 'MacBook', url: '/products/macbook.jpg' },
    { label: 'Keyboard', url: '/products/keyboard.jpg' },
    { label: 'Mouse', url: '/products/mouse.jpg' },
    { label: 'Monitor', url: '/products/monitor.jpg' },
    { label: 'Headphones', url: '/products/headphones.jpg' },
  ];

  const getProductImage = (product: Product): string => {
    if (product.imageUrl) return product.imageUrl;
    const text = (product.name + ' ' + (product.description || '')).toLowerCase();
    if (text.includes('macbook') || text.includes('laptop')) return '/products/macbook.jpg';
    if (text.includes('keyboard') || text.includes('keychron')) return '/products/keyboard.jpg';
    if (text.includes('mouse') || text.includes('master') || text.includes('logitech')) return '/products/mouse.jpg';
    if (text.includes('monitor') || text.includes('dell') || text.includes('display')) return '/products/monitor.jpg';
    if (text.includes('headphone') || text.includes('sony') || text.includes('audio')) return '/products/headphones.jpg';
    return '/products/macbook.jpg';
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormImageUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = () => {
    fetchAnalytics();
    fetchProducts();
    fetchOrders();
  };

  const fetchAnalytics = async () => {
    try {
      setLoadingAnalytics(true);
      const data = await api.getAnalytics();
      setAnalytics(data);
    } catch (err: any) {
      console.warn('Analytics query error:', err);
    } finally {
      setLoadingAnalytics(false);
    }
  };

  const fetchProducts = async () => {
    try {
      setLoadingProducts(true);
      setErrorAlert(null);
      const data = await api.getProducts();
      setProducts(data);
    } catch (err: any) {
      console.warn('Backend products error:', err);
      try {
        const local = (api as any).getLocalCatalog?.() || [];
        setProducts(local);
      } catch {
        setErrorAlert('Could not retrieve product list');
      }
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
      console.warn('Failed to load orders:', err);
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    setUpdatingOrderId(orderId);
    try {
      await api.updateOrderStatus(orderId, newStatus);
      setSuccessAlert(`Order #${orderId.slice(0, 8)} status updated to ${newStatus}`);
      setTimeout(() => setSuccessAlert(null), 3000);
      await fetchOrders();
    } catch (err: any) {
      setErrorAlert(`Failed to update order status: ${err.message}`);
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (!confirm(`Are you sure you want to delete order #${orderId}? Inventory units will be restored.`)) return;
    try {
      await api.deleteOrder(orderId);
      setSuccessAlert(`Order #${orderId.slice(0, 8)} deleted successfully`);
      setTimeout(() => setSuccessAlert(null), 3000);
      await fetchOrders();
    } catch (err: any) {
      setErrorAlert(`Failed to delete order: ${err.message}`);
    }
  };

  const openCreateModal = () => {
    setEditingProduct(null);
    setFormName('');
    setFormDescription('');
    setFormPrice('');
    setFormStock('');
    setFormImageUrl('/products/macbook.jpg');
    setIsModalOpen(true);
  };

  const openEditModal = (prod: Product) => {
    setEditingProduct(prod);
    setFormName(prod.name);
    setFormDescription(prod.description || '');
    setFormPrice(String(prod.price));
    setFormStock(String(prod.stock));
    setFormImageUrl(prod.imageUrl || getProductImage(prod));
    setIsModalOpen(true);
  };

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitting(true);
    setErrorAlert(null);

    const priceNum = parseFloat(formPrice);
    const stockNum = parseInt(formStock, 10);

    if (isNaN(priceNum) || priceNum <= 0) {
      setErrorAlert('Price must be a positive number');
      setFormSubmitting(false);
      return;
    }

    if (isNaN(stockNum) || stockNum < 0) {
      setErrorAlert('Stock must be an integer greater than or equal to 0');
      setFormSubmitting(false);
      return;
    }

    try {
      if (editingProduct) {
        await api.updateProduct(editingProduct.id, {
          name: formName,
          description: formDescription,
          price: priceNum,
          stock: stockNum,
          imageUrl: formImageUrl,
        });
        setSuccessAlert(`Product "${formName}" updated successfully`);
      } else {
        await api.createProduct({
          name: formName,
          description: formDescription,
          price: priceNum,
          stock: stockNum,
          imageUrl: formImageUrl,
        });
        setSuccessAlert(`Product "${formName}" created successfully`);
      }

      setIsModalOpen(false);
      await fetchProducts();
    } catch (err: any) {
      setErrorAlert(err.message || 'Operation failed');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDeleteProduct = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete product "${name}"?`)) {
      return;
    }

    try {
      await api.deleteProduct(id);
      setSuccessAlert(`Product "${name}" deleted successfully`);
      await fetchProducts();
    } catch (err: any) {
      setErrorAlert(err.message || 'Failed to delete product');
    }
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Alert Banners */}
      {errorAlert && (
        <div className="flex items-center justify-between p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm animate-fade-in">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{errorAlert}</span>
          </div>
          <button onClick={() => setErrorAlert(null)} className="text-xs hover:underline text-rose-800 font-bold">
            Dismiss
          </button>
        </div>
      )}

      {successAlert && (
        <div className="flex items-center justify-between p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-800 text-sm animate-fade-in">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
            <span>{successAlert}</span>
          </div>
          <button onClick={() => setSuccessAlert(null)} className="text-xs hover:underline text-amber-900 font-bold">
            Dismiss
          </button>
        </div>
      )}

      {/* Analytics Summary Cards */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[#EAB308]" />
              Executive Analytics Summary
            </h2>
          </div>
          <button
            onClick={fetchAnalytics}
            disabled={loadingAnalytics}
            className="self-start sm:self-auto flex items-center text-xs text-slate-700 hover:text-slate-900 bg-white border border-slate-200 rounded-xl px-3 py-1.5 transition font-bold shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loadingAnalytics ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Total Revenue */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Total Revenue</span>
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black font-mono text-slate-900">
              {loadingAnalytics ? (
                <Loader2 className="w-5 h-5 animate-spin text-sky-500" />
              ) : (
                `$${(analytics?.total_revenue || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
              )}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Aggregated completed order totals</p>
          </div>

          {/* Total Orders Processed */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Total Orders</span>
              <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
                <ShoppingCart className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black font-mono text-slate-900">
              {loadingAnalytics ? (
                <Loader2 className="w-5 h-5 animate-spin text-sky-500" />
              ) : (
                (analytics?.total_orders || 0).toLocaleString()
              )}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Distinct orders recorded in database</p>
          </div>

          {/* Top Selling Product */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Top Selling Product</span>
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Package className="w-4 h-4" />
              </div>
            </div>
            <div className="text-base font-bold text-slate-900 truncate" title={analytics?.top_selling_product_name}>
              {loadingAnalytics ? (
                <Loader2 className="w-5 h-5 animate-spin text-sky-500" />
              ) : (
                analytics?.top_selling_product_name || 'N/A'
              )}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Highest cumulative volume sold</p>
          </div>
        </div>
      </div>

      {/* Product Management Section */}
      <div className="space-y-4 pt-4 border-t border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
              <Package className="w-5 h-5 text-[#EAB308]" />
              Product Inventory Management
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Create, update, or remove items from the catalog
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={fetchProducts}
              disabled={loadingProducts}
              className="p-2 text-slate-500 hover:text-slate-800 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition shadow-sm"
            >
              <RefreshCw className={`w-4 h-4 ${loadingProducts ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={openCreateModal}
              className="flex items-center text-xs py-2 px-3.5 bg-[#FACC15] hover:bg-yellow-400 active:scale-[0.98] text-slate-950 font-black rounded-xl shadow-sm transition"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Add Product
            </button>
          </div>
        </div>

        {/* Products Table */}
        <div className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[550px]">
              <thead className="bg-slate-50 text-slate-700 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4 w-16">Image</th>
                  <th className="py-3.5 px-4">Product Name</th>
                  <th className="py-3.5 px-4">Price</th>
                  <th className="py-3.5 px-4">Stock</th>
                  <th className="py-3.5 px-4">Created At</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loadingProducts ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-500">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-sky-500" />
                      Loading inventory products...
                    </td>
                  </tr>
                ) : products.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500">
                      No products found. Click "Add Product" to create one.
                    </td>
                  </tr>
                ) : (
                  products.map((product) => (
                    <tr key={product.id} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-4">
                        <img
                          src={getProductImage(product)}
                          alt={product.name}
                          className="w-11 h-11 object-cover rounded-xl border border-slate-200 bg-slate-100"
                        />
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        <div>{product.name}</div>
                        {product.description && (
                          <div className="text-[11px] text-slate-500 font-normal truncate max-w-xs">
                            {product.description}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                        ${Number(product.price).toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`font-mono px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            product.stock === 0
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : product.stock < 10
                              ? 'bg-amber-50 text-amber-800 border border-amber-200'
                              : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          }`}
                        >
                          {product.stock} units
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                        {new Date(product.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-2">
                        <button
                          onClick={() => openEditModal(product)}
                          className="p-1.5 text-slate-600 hover:text-sky-600 hover:bg-slate-100 rounded-lg transition"
                          title="Edit Product"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(product.id, product.name)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          title="Delete Product"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Global Order Ledger Section */}
      <div className="space-y-4 pt-4 border-t border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-sky-600" />
              Global Order Ledger & Tracking
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Manage incoming customer orders, update delivery progress, and inspect live carrier telemetry
            </p>
          </div>
          <button
            onClick={fetchOrders}
            disabled={loadingOrders}
            className="p-2 text-slate-500 hover:text-slate-800 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition shadow-sm self-start sm:self-auto"
            title="Refresh orders ledger"
          >
            <RefreshCw className={`w-4 h-4 ${loadingOrders ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Filter and Search Bar for Orders */}
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
          <div className="relative w-full md:w-80">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={orderSearch}
              onChange={(e) => setOrderSearch(e.target.value)}
              placeholder="Search by customer email or order ID..."
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-sky-500 text-xs"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1 w-full md:w-auto">
            {(['ALL', 'PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setOrderStatusFilter(st)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition border ${
                  orderStatusFilter === st
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {st === 'ALL' ? 'All Orders' : st}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[760px]">
              <thead className="bg-slate-50 text-slate-700 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Order ID</th>
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Items Breakdown</th>
                  <th className="py-3.5 px-4">Total Amount</th>
                  <th className="py-3.5 px-4">Fulfillment Status</th>
                  <th className="py-3.5 px-4">Timestamp</th>
                  <th className="py-3.5 px-4 text-right">Actions & Tracking</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loadingOrders ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-500">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-sky-500" />
                      Loading ledger records...
                    </td>
                  </tr>
                ) : orders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500">
                      No customer orders have been processed yet.
                    </td>
                  </tr>
                ) : (
                  orders
                    .filter((ord) => {
                      const st = (ord.status || 'PROCESSING').toUpperCase();
                      if (orderStatusFilter !== 'ALL') {
                        if (orderStatusFilter === 'DELIVERED' && (st === 'DELIVERED' || st === 'COMPLETED')) {
                          // match
                        } else if (st !== orderStatusFilter) {
                          return false;
                        }
                      }
                      if (orderSearch.trim()) {
                        const q = orderSearch.toLowerCase();
                        const matchId = ord.id.toLowerCase().includes(q);
                        const matchEmail = (ord.user?.email || '').toLowerCase().includes(q);
                        return matchId || matchEmail;
                      }
                      return true;
                    })
                    .map((order) => {
                      const currentStatus = (order.status || 'PROCESSING').toUpperCase();
                      const isUpdating = updatingOrderId === order.id;

                      return (
                        <tr key={order.id} className="hover:bg-slate-50 transition">
                          <td className="py-3.5 px-4 font-mono font-bold text-sky-700">
                            #{order.id.slice(0, 8)}
                          </td>
                          <td className="py-3.5 px-4 text-slate-800 font-mono">
                            {order.user?.email || order.userId}
                          </td>
                          <td className="py-3.5 px-4 text-slate-700">
                            <div className="space-y-0.5">
                              {order.items?.map((item) => (
                                <div key={item.id} className="text-[11px]">
                                  <span className="font-bold text-amber-600">{item.quantity}×</span>{' '}
                                  {item.product?.name || 'Item'} (${Number(item.priceAtPurchase).toFixed(2)})
                                </div>
                              ))}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 font-mono font-black text-slate-900">
                            ${Number(order.totalAmount).toFixed(2)}
                          </td>
                          <td className="py-3.5 px-4">
                            {/* Live Status Selector */}
                            <select
                              value={currentStatus === 'COMPLETED' ? 'DELIVERED' : currentStatus}
                              disabled={isUpdating}
                              onChange={(e) => handleUpdateStatus(order.id, e.target.value)}
                              className={`text-[11px] font-bold rounded-lg px-2 py-1 border focus:outline-none cursor-pointer transition ${
                                currentStatus === 'DELIVERED' || currentStatus === 'COMPLETED'
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                  : currentStatus === 'SHIPPED' || currentStatus === 'OUT_FOR_DELIVERY'
                                  ? 'bg-sky-50 text-sky-800 border-sky-300'
                                  : currentStatus === 'CANCELLED'
                                  ? 'bg-rose-50 text-rose-800 border-rose-300'
                                  : 'bg-amber-50 text-amber-900 border-amber-300'
                              }`}
                            >
                              <option value="PENDING">PENDING</option>
                              <option value="PROCESSING">PROCESSING</option>
                              <option value="SHIPPED">SHIPPED</option>
                              <option value="OUT_FOR_DELIVERY">OUT FOR DELIVERY</option>
                              <option value="DELIVERED">DELIVERED</option>
                              <option value="CANCELLED">CANCELLED</option>
                            </select>
                          </td>
                          <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                            {new Date(order.createdAt).toLocaleString()}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end space-x-1.5">
                              {/* Track Shipment Button */}
                              <button
                                onClick={() => setSelectedTrackingOrderId(order.id)}
                                className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 rounded-lg font-bold text-[11px] flex items-center space-x-1 transition shadow-xs"
                                title="Open Live Shipment Tracker"
                              >
                                <Truck className="w-3 h-3 text-amber-600" />
                                <span>Track</span>
                              </button>

                              {/* Delete Order Button */}
                              <button
                                onClick={() => handleDeleteOrder(order.id)}
                                className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                                title="Delete Order record"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>


      {/* Product Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-lg bg-white border border-slate-200 rounded-3xl shadow-2xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold text-slate-900 mb-1">
              {editingProduct ? 'Edit Product' : 'Add New Inventory Product'}
            </h3>
            <p className="text-xs text-slate-500 mb-6">
              {editingProduct
                ? 'Update product specs, price, or stock levels'
                : 'Publish a new item to the customer product catalog'}
            </p>

            <form onSubmit={handleProductSubmit} className="space-y-4 text-xs">
              {/* Product Image Upload Section */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <label className="block text-slate-700 font-bold">Product Image</label>
                
                <div className="flex items-center space-x-3">
                  <div className="w-16 h-16 rounded-xl border border-slate-200 overflow-hidden bg-white flex-shrink-0">
                    {formImageUrl ? (
                      <img
                        src={formImageUrl}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400">
                        <ImageIcon className="w-6 h-6" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 space-y-1.5">
                    <label className="cursor-pointer inline-flex items-center space-x-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:border-slate-300 rounded-xl text-slate-800 font-bold shadow-sm transition active:scale-95 text-[11px]">
                      <Upload className="w-3.5 h-3.5 text-sky-600" />
                      <span>Upload Image File</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                    <p className="text-[10px] text-slate-400">
                      Upload from computer, select preset below, or paste URL
                    </p>
                  </div>
                </div>

                {/* Preset Chips */}
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                    Or select standard image preset:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {imagePresets.map((preset) => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => setFormImageUrl(preset.url)}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition border ${
                          formImageUrl === preset.url
                            ? 'bg-sky-50 border-sky-400 text-sky-700 shadow-xs'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Image URL Input */}
                <div>
                  <input
                    type="text"
                    value={formImageUrl}
                    onChange={(e) => setFormImageUrl(e.target.value)}
                    placeholder="Image URL: /products/macbook.jpg or https://..."
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-sky-500 text-[11px]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Product Name *</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. MacBook Pro 16"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Description</label>
                <textarea
                  rows={3}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Specs, hardware details, warranty..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Price ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    placeholder="199.99"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-sky-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Stock Units *</label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    required
                    value={formStock}
                    onChange={(e) => setFormStock(e.target.value)}
                    placeholder="50"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-sky-500 font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-5 py-2.5 bg-[#FACC15] hover:bg-yellow-400 disabled:opacity-50 text-slate-950 font-black rounded-xl flex items-center transition shadow-sm"
                >
                  {formSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />}
                  {editingProduct ? 'Save Changes' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
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

