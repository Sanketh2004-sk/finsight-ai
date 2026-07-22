import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useForm } from 'react-hook-form';
import { 
  Plus, 
  CalendarRange, 
  Trash2, 
  X, 
  AlertCircle, 
  Sparkles,
  ToggleLeft,
  ToggleRight,
  PlusCircle,
  Bell
} from 'lucide-react';
import { LoadingSpinner, EmptyState } from '../components/Feedback';

const CATEGORIES = [
  "Streaming", "Software", "Cloud Storage", "Music", "News", "Gaming", "Fitness", "Food", "Education", "Other"
];

export const Subscriptions = () => {
  const [subs, setSubs] = useState([]);
  const [monthlyTotal, setMonthlyTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);

  const { register, handleSubmit, reset } = useForm();

  const fetchSubscriptions = async () => {
    setLoading(true);
    try {
      const res = await api.get('/subscriptions');
      if (res.data.success) {
        setSubs(res.data.subscriptions);
        setMonthlyTotal(res.data.monthlyTotal);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const openAddModal = () => {
    reset({
      name: '',
      amount: '',
      billingCycle: 'monthly',
      category: 'Streaming',
      nextRenewalDate: new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0],
      reminderDaysBefore: 3,
      notes: ''
    });
    setErrorMsg('');
    setModalOpen(true);
  };

  const handleCreateSub = async (formData) => {
    setSubmitLoading(true);
    setErrorMsg('');
    try {
      const res = await api.post('/subscriptions', formData);
      if (res.data.success) {
        setModalOpen(false);
        fetchSubscriptions();
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to register subscription.');
    } finally {
      setSubmitLoading(false);
    }
  };

  const toggleActive = async (sub) => {
    try {
      const res = await api.put(`/subscriptions/${sub._id}`, { isActive: !sub.isActive });
      if (res.data.success) {
        fetchSubscriptions();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to cancel tracking this subscription?')) return;
    try {
      const res = await api.delete(`/subscriptions/${id}`);
      if (res.data.success) {
        fetchSubscriptions();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight font-heading text-white">
            Subscription Tracker
          </h1>
          <p className="text-xs text-slate-400 mt-1">Audit and optimize your recurring service billings</p>
        </div>
        <button 
          onClick={openAddModal}
          className="px-5 py-2.5 rounded-xl btn-primary text-xs font-bold text-white shadow-md flex items-center gap-1.5 self-stretch sm:self-auto justify-center"
        >
          <Plus className="w-4 h-4" /> Add Subscription
        </button>
      </div>

      {/* Monthly billing aggregator */}
      <div className="glass-panel p-6 rounded-2xl border border-glassBorder flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />
        <div>
          <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider mb-0.5">Aggregated Monthly Cost</span>
          <span className="text-2xl font-extrabold text-white font-heading">₹{parseFloat(monthlyTotal).toLocaleString('en-IN')}</span>
        </div>
        <div className="flex items-center gap-2 p-3 bg-indigo-500/5 rounded-xl border border-indigo-500/10 max-w-sm">
          <Bell className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
          <span className="text-[10px] text-slate-400 leading-relaxed font-semibold">
            We will check and prompt notifications automatically 3 days before renewal.
          </span>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner message="Checking active subscriptions..." />
      ) : subs.length === 0 ? (
        <EmptyState 
          title="No subscriptions active" 
          description="Save and track cloud space, video streaming platforms, or gym memberships." 
          icon={CalendarRange}
          actionButton={
            <button onClick={openAddModal} className="px-4 py-2 rounded-lg btn-primary text-xs font-bold text-white">
              Configure Subscription
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {subs.map((sub) => (
            <div key={sub._id} className={`glass-panel p-5 rounded-2xl border transition-all ${
              sub.isActive ? 'border-glassBorder hover:border-indigo-500/25' : 'border-glassBorder/40 opacity-60'
            }`}>
              <div className="flex justify-between items-start">
                <div>
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-[9px] text-slate-400 border border-slate-700/60 font-semibold">
                    {sub.category}
                  </span>
                  <h3 className="text-sm font-bold text-white font-heading mt-2">{sub.name}</h3>
                  <div className="text-[10px] text-slate-400 font-bold mt-1">
                    ₹{sub.amount.toLocaleString('en-IN')} <span className="text-slate-500 font-normal uppercase">/ {sub.billingCycle}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => toggleActive(sub)}
                    className="p-1 hover:bg-slate-800/40 rounded transition-colors"
                  >
                    {sub.isActive ? (
                      <ToggleRight className="w-6 h-6 text-emerald-400" />
                    ) : (
                      <ToggleLeft className="w-6 h-6 text-slate-500" />
                    )}
                  </button>
                  <button 
                    onClick={() => handleDelete(sub._id)}
                    className="p-1 text-slate-500 hover:text-red-400 rounded hover:bg-red-500/10 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-glassBorder/40 flex justify-between items-center text-[10px]">
                <span className="text-slate-500 font-semibold">Next Renewal Date</span>
                <span className="text-slate-350 font-bold">
                  {new Date(sub.nextRenewalDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Config Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md glass-panel rounded-2xl border border-glassBorder overflow-hidden animate-in zoom-in-95 duration-200 shadow-2xl">
            <div className="p-5 border-b border-glassBorder flex justify-between items-center bg-slate-900/60">
              <h2 className="text-sm font-bold text-white font-heading">Configure Subscription</h2>
              <button onClick={() => setModalOpen(false)} className="p-1 text-slate-400 hover:text-white hover:bg-slate-800/60 rounded-lg">
                <X className="w-4 h-4" />
              </button>
            </div>

            {errorMsg && (
              <div className="m-5 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit(handleCreateSub)} className="p-5 space-y-4">
              <div>
                <label className="block text-[10px] font-semibold text-slate-300 uppercase mb-1">Service Name</label>
                <input
                  type="text"
                  placeholder="e.g. Netflix, AWS, Spotify"
                  className="w-full px-3 py-2 text-xs glass-input font-medium"
                  {...register('name', { required: true })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-300 uppercase mb-1">Billing Amount (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    className="w-full px-3 py-2 text-xs glass-input font-medium"
                    {...register('amount', { required: true, min: 0.01 })}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-300 uppercase mb-1">Billing Cycle</label>
                  <select
                    className="w-full px-3 py-2 text-xs glass-input font-medium"
                    {...register('billingCycle', { required: true })}
                  >
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-300 uppercase mb-1">Renewal Date</label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 text-xs glass-input font-medium"
                    {...register('nextRenewalDate', { required: true })}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-300 uppercase mb-1">Category</label>
                  <select
                    className="w-full px-3 py-2 text-xs glass-input font-medium"
                    {...register('category', { required: true })}
                  >
                    {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-300 uppercase mb-1">Days Before Renewal to Remind</label>
                <input
                  type="number"
                  className="w-full px-3 py-2 text-xs glass-input font-medium"
                  {...register('reminderDaysBefore', { required: true, min: 1, max: 10 })}
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-900 border border-glassBorder hover:bg-slate-800/40 text-xs font-semibold text-slate-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitLoading}
                  className="px-5 py-2 rounded-lg btn-primary text-xs font-bold text-white disabled:opacity-50"
                >
                  {submitLoading ? 'Saving...' : 'Track Subscription'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default Subscriptions;
