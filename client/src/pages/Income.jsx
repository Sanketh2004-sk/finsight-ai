import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useForm } from 'react-hook-form';
import { 
  Plus, 
  Search, 
  Trash2, 
  Edit3, 
  X, 
  AlertCircle,
  TrendingUp,
  Filter
} from 'lucide-react';
import { LoadingSpinner, EmptyState } from '../components/Feedback';

const SOURCES = [
  "Salary", "Freelance", "Business", "Investment", "Rental", "Bonus", "Gift", "Refund", "Other"
];

export const Income = () => {
  const [incomes, setIncomes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [source, setSource] = useState('');
  const [sort, setSort] = useState('-date');

  // Modals
  const [modalOpen, setModalOpen] = useState(false);
  const [editingIncome, setEditingIncome] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);

  const { register, handleSubmit, reset } = useForm();

  const fetchIncomes = async () => {
    setLoading(true);
    try {
      const res = await api.get('/incomes', {
        params: {
          source,
          sort,
          page,
          limit: 15
        }
      });
      if (res.data.success) {
        setIncomes(res.data.incomes);
        setTotal(res.data.pagination.total);
        setTotalPages(res.data.pagination.pages);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncomes();
  }, [page, source, sort]);

  const openAddModal = () => {
    setEditingIncome(null);
    reset({
      amount: '',
      source: 'Salary',
      date: new Date().toISOString().split('T')[0],
      description: '',
      notes: '',
      isRecurring: false
    });
    setErrorMsg('');
    setModalOpen(true);
  };

  const openEditModal = (income) => {
    setEditingIncome(income);
    reset({
      amount: income.amount,
      source: income.source,
      date: new Date(income.date).toISOString().split('T')[0],
      description: income.description || '',
      notes: income.notes || '',
      isRecurring: income.isRecurring || false
    });
    setErrorMsg('');
    setModalOpen(true);
  };

  const handleFormSubmit = async (formData) => {
    setSubmitLoading(true);
    setErrorMsg('');
    try {
      let res;
      if (editingIncome) {
        res = await api.put(`/incomes/${editingIncome._id}`, formData);
      } else {
        res = await api.post('/incomes', formData);
      }

      if (res.data.success) {
        setModalOpen(false);
        fetchIncomes();
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Something went wrong.');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this income record?')) return;
    try {
      const res = await api.delete(`/incomes/${id}`);
      if (res.data.success) {
        fetchIncomes();
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
            Income Streams
          </h1>
          <p className="text-xs text-slate-400 mt-1">Track your incoming salary, business, and sales inflows</p>
        </div>
        <button 
          onClick={openAddModal}
          className="px-5 py-2.5 rounded-xl btn-primary text-xs font-bold text-white shadow-md flex items-center gap-1.5 self-stretch sm:self-auto justify-center"
        >
          <Plus className="w-4 h-4" /> Add Income
        </button>
      </div>

      {/* Filter panel */}
      <div className="glass-panel p-4 rounded-xl border border-glassBorder flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex flex-wrap gap-3 items-center w-full sm:w-auto">
          <div className="w-full sm:w-48">
            <select
              className="w-full px-3 py-2 text-xs glass-input font-medium"
              value={source}
              onChange={(e) => { setSource(e.target.value); setPage(1); }}
            >
              <option value="">All Income Sources</option>
              {SOURCES.map(src => <option key={src} value={src}>{src}</option>)}
            </select>
          </div>
          <div className="w-full sm:w-48">
            <select
              className="w-full px-3 py-2 text-xs glass-input font-medium"
              value={sort}
              onChange={(e) => { setSort(e.target.value); setPage(1); }}
            >
              <option value="-date">Newest Date</option>
              <option value="date">Oldest Date</option>
              <option value="-amount">Highest Amount</option>
              <option value="amount">Lowest Amount</option>
            </select>
          </div>
        </div>
        <div className="text-xs text-slate-400 font-semibold self-start sm:self-auto">
          Total Inflows: {total} entries
        </div>
      </div>

      {/* Main Table */}
      {loading ? (
        <LoadingSpinner message="Retrieving your cash inflows..." />
      ) : incomes.length === 0 ? (
        <EmptyState 
          title="No income logs found" 
          description="Log some salaries or gig payouts to fill this chart." 
          icon={TrendingUp}
          actionButton={
            <button onClick={openAddModal} className="px-4 py-2 rounded-lg btn-primary text-xs font-bold text-white">
              Log Income
            </button>
          }
        />
      ) : (
        <div className="glass-panel rounded-2xl border border-glassBorder overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-glassBorder text-slate-400 font-semibold bg-slate-900/40">
                  <th className="p-4">Source</th>
                  <th className="p-4">Description</th>
                  <th className="p-4">Date</th>
                  <th className="p-4 text-right">Amount</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {incomes.map((inc) => (
                  <tr key={inc._id} className="border-b border-glassBorder/40 hover:bg-slate-800/10 transition-colors">
                    <td className="p-4">
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-[10px] font-bold text-emerald-400 border border-emerald-500/20">
                        {inc.source}
                      </span>
                    </td>
                    <td className="p-4 font-semibold text-slate-200">
                      {inc.description || 'Income Entry'}
                      {inc.notes && <div className="text-[10px] text-slate-500 font-normal mt-0.5">{inc.notes}</div>}
                    </td>
                    <td className="p-4 text-slate-400">
                      {new Date(inc.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="p-4 text-right text-emerald-400 font-extrabold">
                      +₹{inc.amount.toLocaleString('en-IN')}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-2">
                        <button 
                          onClick={() => openEditModal(inc)}
                          className="p-1.5 text-slate-400 hover:text-indigo-400 rounded hover:bg-indigo-500/10 transition-colors"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => handleDelete(inc._id)}
                          className="p-1.5 text-slate-400 hover:text-red-400 rounded hover:bg-red-500/10 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="p-4 border-t border-glassBorder/60 flex items-center justify-between bg-slate-900/20 text-xs">
              <span className="text-slate-400">Total {total} entries</span>
              <div className="flex items-center gap-2">
                <button
                  disabled={page === 1}
                  onClick={() => setPage(prev => Math.max(1, prev - 1))}
                  className="px-3 py-1.5 rounded bg-slate-900 border border-glassBorder hover:bg-slate-800/40 text-slate-300 disabled:opacity-40 transition-colors"
                >
                  Previous
                </button>
                <span className="text-slate-200">Page {page} of {totalPages}</span>
                <button
                  disabled={page === totalPages}
                  onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
                  className="px-3 py-1.5 rounded bg-slate-900 border border-glassBorder hover:bg-slate-800/40 text-slate-300 disabled:opacity-40 transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal Dialog */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md glass-panel rounded-2xl border border-glassBorder overflow-hidden animate-in zoom-in-95 duration-200 shadow-2xl">
            <div className="p-5 border-b border-glassBorder flex justify-between items-center bg-slate-900/60">
              <h2 className="text-sm font-bold text-white font-heading">
                {editingIncome ? 'Edit Income Record' : 'Log New Income'}
              </h2>
              <button 
                onClick={() => setModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white hover:bg-slate-800/60 rounded-lg transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {errorMsg && (
              <div className="m-5 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit(handleFormSubmit)} className="p-5 space-y-4">
              <div>
                <label className="block text-[10px] font-semibold text-slate-300 uppercase mb-1">Amount (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  className="w-full px-3 py-2 text-xs glass-input font-medium"
                  {...register('amount', { required: true, min: 0.01 })}
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-300 uppercase mb-1">Source</label>
                <select
                  className="w-full px-3 py-2 text-xs glass-input font-medium"
                  {...register('source', { required: true })}
                >
                  {SOURCES.map(src => <option key={src} value={src}>{src}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-300 uppercase mb-1">Date</label>
                <input
                  type="date"
                  className="w-full px-3 py-2 text-xs glass-input font-medium"
                  {...register('date', { required: true })}
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-300 uppercase mb-1">Description</label>
                <input
                  type="text"
                  placeholder="e.g. Monthly Salary payment"
                  className="w-full px-3 py-2 text-xs glass-input font-medium"
                  {...register('description')}
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isRecurring"
                  className="w-4 h-4 rounded border-glassBorder bg-[#0a0f1a] text-indigo-500 accent-indigo-500"
                  {...register('isRecurring')}
                />
                <label htmlFor="isRecurring" className="text-xs font-semibold text-slate-300">Recurring payment</label>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-300 uppercase mb-1">Notes</label>
                <textarea
                  placeholder="Additional notes..."
                  rows="2"
                  className="w-full px-3 py-2 text-xs glass-input font-medium resize-none"
                  {...register('notes')}
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
                  {submitLoading ? 'Saving...' : 'Save Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default Income;
