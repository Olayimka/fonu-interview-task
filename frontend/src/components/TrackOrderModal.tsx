import React, { useState, useEffect } from 'react';
import { OrderTrackingInfo } from '../types';
import { api } from '../services/api';
import {
  X,
  Truck,
  Package,
  CheckCircle2,
  Clock,
  MapPin,
  Calendar,
  Copy,
  Check,
  AlertTriangle,
  Loader2,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

interface TrackOrderModalProps {
  orderId: string | null;
  onClose: () => void;
}

export const TrackOrderModal: React.FC<TrackOrderModalProps> = ({ orderId, onClose }) => {
  const [tracking, setTracking] = useState<OrderTrackingInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) return;
    setLoading(true);
    setError(null);
    api
      .getOrderTracking(orderId)
      .then((data) => {
        setTracking(data);
      })
      .catch((err) => {
        setError(err.message || 'Could not retrieve tracking details');
      })
      .finally(() => setLoading(false));
  }, [orderId]);

  if (!orderId) return null;

  const handleCopyTracking = () => {
    if (tracking?.trackingNumber) {
      navigator.clipboard.writeText(tracking.trackingNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getStepIcon = (step: number, completed: boolean, current: boolean) => {
    if (completed && !current) {
      return <CheckCircle2 className="w-5 h-5 text-emerald-600" />;
    }
    if (current) {
      return (
        <span className="relative flex h-5 w-5 items-center justify-center">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500" />
        </span>
      );
    }
    return <div className="w-4 h-4 rounded-full border-2 border-slate-300 bg-white" />;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-slate-900 via-slate-800 to-sky-950 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-black shadow-md">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-2">
                Shipment Tracker
              </h2>
              <p className="text-[11px] text-slate-300 font-mono">
                Order #{orderId.length > 16 ? orderId.slice(0, 12) + '...' : orderId}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 text-slate-900 text-xs">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
              <p className="text-xs font-bold text-slate-600">Connecting to carrier telemetry...</p>
            </div>
          ) : error || !tracking ? (
            <div className="py-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900">Tracking Info Not Found</h3>
              <p className="text-slate-500 max-w-xs mx-auto text-[11px]">
                {error || 'We could not locate active transit coordinates for this order.'}
              </p>
            </div>
          ) : (
            <>
              {/* Carrier & Tracking Meta Card */}
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Carrier & Method
                  </span>
                  <div className="font-extrabold text-sm text-slate-900 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-sky-600" />
                    <span>{tracking.carrier}</span>
                  </div>
                  <span className="text-[11px] text-slate-500 mt-0.5 block">
                    {tracking.serviceType}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Tracking Number
                  </span>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-bold text-sm text-sky-700 bg-sky-50 px-2.5 py-1 rounded-lg border border-sky-200">
                      {tracking.trackingNumber}
                    </span>
                    <button
                      onClick={handleCopyTracking}
                      className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 transition"
                      title="Copy Tracking Number"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="pt-2 sm:pt-0 sm:border-t-0 border-t border-slate-200">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Estimated Delivery
                  </span>
                  <div className="flex items-center space-x-1.5 font-bold text-slate-900">
                    <Calendar className="w-3.5 h-3.5 text-amber-500" />
                    <span>{tracking.estimatedDelivery}</span>
                  </div>
                </div>

                <div className="pt-2 sm:pt-0 sm:border-t-0 border-t border-slate-200">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Current Status
                  </span>
                  <span
                    className={`inline-block px-2.5 py-1 rounded-full font-bold text-[11px] ${
                      tracking.status === 'DELIVERED' || tracking.status === 'COMPLETED'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : tracking.status === 'SHIPPED' || tracking.status === 'OUT_FOR_DELIVERY'
                        ? 'bg-sky-100 text-sky-800 border border-sky-300'
                        : tracking.status === 'CANCELLED'
                        ? 'bg-rose-100 text-rose-800 border border-rose-300'
                        : 'bg-amber-100 text-amber-900 border border-amber-300'
                    }`}
                  >
                    {tracking.statusLabel}
                  </span>
                </div>
              </div>

              {/* Visual Progress Stepper */}
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-600 mb-4 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-sky-600" />
                  <span>Shipment Timeline Progress</span>
                </h3>

                <div className="relative pl-6 space-y-6 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                  {tracking.milestones.map((m) => (
                    <div key={m.step} className="relative flex items-start space-x-4">
                      {/* Step Indicator Dot */}
                      <div className="absolute -left-6 bg-white p-0.5 rounded-full">
                        {getStepIcon(m.step, m.completed, m.current)}
                      </div>

                      {/* Step Text Info */}
                      <div
                        className={`p-3.5 rounded-2xl border transition w-full ${
                          m.current
                            ? 'bg-amber-50/70 border-amber-300 shadow-sm'
                            : m.completed
                            ? 'bg-white border-slate-200'
                            : 'bg-slate-50/50 border-slate-100 opacity-60'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                          <h4
                            className={`font-bold text-xs ${
                              m.current
                                ? 'text-amber-950 font-extrabold'
                                : m.completed
                                ? 'text-slate-900'
                                : 'text-slate-500'
                            }`}
                          >
                            {m.title}
                          </h4>
                          <span className="text-[10px] font-mono text-slate-400 font-medium">
                            {m.timestamp}
                          </span>
                        </div>

                        <p className="text-[11px] text-slate-600 leading-relaxed mb-1.5">
                          {m.description}
                        </p>

                        <div className="flex items-center text-[10px] text-slate-400 space-x-1">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          <span>{m.location}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Package Details Footer */}
              <div className="p-3.5 rounded-2xl bg-sky-50/70 border border-sky-100 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Package className="w-4 h-4 text-sky-600" />
                  <span className="font-semibold text-slate-700">
                    {tracking.itemsCount} {tracking.itemsCount === 1 ? 'item' : 'items'} in shipment
                  </span>
                </div>
                <span className="font-mono font-black text-slate-900 text-sm">
                  ${tracking.totalAmount.toFixed(2)}
                </span>
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center text-xs">
          <span className="text-[11px] text-slate-500">
            Carrier queries refresh automatically every 60s
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
