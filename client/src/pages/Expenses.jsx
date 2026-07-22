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
  Filter,
  ArrowUpDown,
  Tag
} from 'lucide-react';
import { LoadingSpinner, EmptyState } from '../components/Feedback';

const CATEGORIES = [
  "Food & Dining", "Shopping", "Transportation", "Entertainment", 
  "Healthcare", "Education", "Utilities", "Rent", "Travel", 
  "Subscriptions", "Groceries", "Fitness", "Personal Care", 
  "Insurance", "Investment", "Gifts & Donations", "Other"
];

const PAYMENT_METHODS = [
  "Cash", "Credit Card", "Debit Card", "UPI", "Net Banking", "Wallet", "Other"
];

export const Expenses = () => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Filters
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [sort, setSort] = useState('-date');
  const [showFilters, setShowFilters] = useState(false);

  // Modals
  const [modalOpen, setModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);

  // Tags input helper
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');

  const { register, handleSubmit, reset, setValue } = useForm();

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const res = await api.get('/expenses', {
        params: {
          search,
          category,
          paymentMethod,
          sort,
          page,
          limit: 15
        }
      });
      if (res.data.success) {
        setExpenses(res.data.expenses);
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
    fetchExpenses();
  }, [page, category, paymentMethod, sort]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchExpenses();
  };

  const openAddModal = () => {
    setEditingExpense(null);
    setTags([]);
    setTagInput('');
    reset({
      amount: '',
      category: 'Food & Dining',
      date: new Date().toISOString().split('T')[0],
      merchant: '',
      paymentMethod: 'UPI',
      description: '',
      notes: '',
      isRecurring: false
    });
    setErrorMsg('');
    setModalOpen(true);
  };

  const openEditModal = (expense) => {
    setEditingExpense(expense);
    setTags(expense.tags || []);
    setTagInput('');
    reset({
      amount: expense.amount,
      category: expense.category,
      date: new Date(expense.date).toISOString().split('T')[0],
      merchant: expense.merchant || '',
      paymentMethod: expense.paymentMethod,
      description: expense.description || '',
      notes: expense.notes || '',
      isRecurring: expense.isRecurring || false
    });
    setErrorMsg('');
    setModalOpen(true);
  };

  const handleAddTag = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const val = tagInput.trim().toLowerCase();
      if (val && !tags.includes(val)) {
        setTags([...tags, val]);
      }
      setTagInput('');
    }
  };

  const handleRemoveTag = (indexToRemove) => {
    setTags(tags.filter((_, i) => i !== indexToRemove));
  };

  const handleFormSubmit = async (formData) => {
    setSubmitLoading(true);
    setErrorMsg('');
    try {
      const payload = { ...formData, tags };
      let res;
      if (editingExpense) {
        res = await api.put(`/expenses/${editingExpense._id}`, payload);
      } else {
        res = await api.post('/expenses', payload);
      }

      if (res.data.success) {
        setModalOpen(false);
        fetchExpenses();
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Something went wrong.');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this expense record?')) return;
    try {
      const res = await api.delete(`/expenses/${id}`);
      if (res.data.success) {
        fetchExpenses();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight font-heading text-white">
            Expenses Ledger
          </h1>
          <p className="text-xs text-slate-400 mt-1">Track and manage your outgoing payments</p>
        </div>
        <button 
          onClick={openAddModal}
          className="px-5 py-2.5 rounded-xl btn-primary text-xs font-bold text-white shadow-md flex items-center gap-1.5 self-stretch sm:self-auto justify-center"
        >
          <Plus className="w-4 h-4" /> Add Expense
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel p-4 rounded-xl border border-glassBorder space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by description, merchant, tags..."
              className="w-full pl-10 pr-4 py-2 text-xs glass-input font-medium"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-2 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-all ${
                showFilters 
                  ? 'bg-indigo-500/10 border-indigo-500/35 text-indigo-300' 
                  : 'bg-[#0a0f1a] border-glassBorder hover:bg-slate-800/20 text-slate-300'
              }`}
            >
              <Filter className="w-4 h-4" /> Filters
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-xs font-bold text-white shadow-md transition-all"
            >
              Search
            </button>
          </div>
        </form>

        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 border-t border-glassBorder/40 animate-in fade-in slide-in-from-top-2 duration-200">
            <div>
              <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Category</label>
              <select
                className="w-full px-3 py-2 text-xs glass-input font-medium"
                value={category}
                onChange={(e) => { setCategory(e.target.value); setPage(1); }}
              >
                <option value="">All Categories</option>
                {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Payment Method</label>
              <select
                className="w-full px-3 py-2 text-xs glass-input font-medium"
                value={paymentMethod}
                onChange={(e) => { setPaymentMethod(e.target.value); setPage(1); }}
              >
                <option value="">All Methods</option>
                {PAYMENT_METHODS.map(method => <option key={method} value={method}>{method}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Sorting</label>
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
        )}
      </div>

      {/* Main Expense Table List */}
      {loading ? (
        <LoadingSpinner message="Retrieving your expenditures..." />
      ) : expenses.length === 0 ? (
        <EmptyState 
          title="No expense logs found" 
          description="You haven't logged any matching expenses yet." 
          icon={Tag}
          actionButton={
            <button onClick={openAddModal} className="px-4 py-2 rounded-lg btn-primary text-xs font-bold text-white">
              Log First Expense
            </button>
          }
        />
      ) : (
        <div className="glass-panel rounded-2xl border border-glassBorder overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-glassBorder text-slate-400 font-semibold bg-slate-900/40">
                  <th className="p-4">Merchant / Notes</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Payment</th>
                  <th className="p-4">Date</th>
                  <th className="p-4">Tags</th>
                  <th className="p-4 text-right">Amount</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((tx) => (
                  <tr key={tx._id} className="border-b border-glassBorder/40 hover:bg-slate-800/10 transition-colors">
                    <td className="p-4 font-semibold text-slate-200">
                      <div>{tx.merchant || 'General Payment'}</div>
                      {tx.description && <div className="text-[10px] text-slate-500 font-normal">{tx.description}</div>}
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 rounded-full bg-slate-850 text-[10px] text-slate-300 border border-slate-700/60">
                        {tx.category}
                      </span>
                    </td>
                    <td className="p-4 text-slate-400 font-medium">{tx.paymentMethod}</td>
                    <td className="p-4 text-slate-400">
                      {new Date(tx.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="p-4">
                      <div className="flex flex-wrap gap-1">
                        {tx.tags?.map((t, idx) => (
                          <span key={idx} className="px-1.5 py-0.5 rounded bg-indigo-500/5 text-[9px] text-indigo-300 border border-indigo-500/15">
                            #{t}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className={`p-4 text-right font-extrabold ${tx.isFraudulent ? 'text-red-400' : 'text-slate-100'}`}>
                      ₹{tx.amount.toLocaleString('en-IN')}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-2">
                        <button 
                          onClick={() => openEditModal(tx)}
                          className="p-1.5 text-slate-400 hover:text-indigo-400 rounded hover:bg-indigo-500/10 transition-colors"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => handleDelete(tx._id)}
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

          {/* Pagination Controls */}
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

      {/* Save / Edit Expense Modal Dialog */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-lg glass-panel rounded-2xl border border-glassBorder overflow-hidden animate-in zoom-in-95 duration-200 shadow-2xl">
            <div className="p-5 border-b border-glassBorder flex justify-between items-center bg-slate-900/60">
              <h2 className="text-sm font-bold text-white font-heading">
                {editingExpense ? 'Edit Expense Record' : 'Log New Expense'}
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
              <div className="grid grid-cols-2 gap-4">
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
                  <label className="block text-[10px] font-semibold text-slate-300 uppercase mb-1">Category</label>
                  <select
                    className="w-full px-3 py-2 text-xs glass-input font-medium"
                    {...register('category', { required: true })}
                  >
                    {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-300 uppercase mb-1">Date</label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 text-xs glass-input font-medium"
                    {...register('date', { required: true })}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-300 uppercase mb-1">Merchant</label>
                  <input
                    type="text"
                    placeholder="e.g. Amazon, Starbucks"
                    className="w-full px-3 py-2 text-xs glass-input font-medium"
                    {...register('merchant')}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-300 uppercase mb-1">Payment Method</label>
                  <select
                    className="w-full px-3 py-2 text-xs glass-input font-medium"
                    {...register('paymentMethod', { required: true })}
                  >
                    {PAYMENT_METHODS.map(method => <option key={method} value={method}>{method}</option>)}
                  </select>
                </div>
                <div className="flex items-center gap-2 pt-5">
                  <input
                    type="checkbox"
                    id="isRecurring"
                    className="w-4 h-4 rounded border-glassBorder bg-[#0a0f1a] text-indigo-500 accent-indigo-500"
                    {...register('isRecurring')}
                  />
                  <label htmlFor="isRecurring" className="text-xs font-semibold text-slate-300">Recurring payment</label>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-300 uppercase mb-1">Description</label>
                <input
                  type="text"
                  placeholder="e.g. Lunch out with team"
                  className="w-full px-3 py-2 text-xs glass-input font-medium"
                  {...register('description')}
                />
              </div>

              {/* Tag Creation Input */}
              <div>
                <label className="block text-[10px] font-semibold text-slate-300 uppercase mb-1">Tags (press Enter to add)</label>
                <div className="w-full p-2 text-xs glass-input font-medium flex flex-wrap gap-1.5 items-center">
                  {tags.map((tag, idx) => (
                    <span key={idx} className="px-2 py-0.5 rounded bg-indigo-500/10 text-[10px] text-indigo-300 border border-indigo-500/20 flex items-center gap-1">
                      {tag}
                      <button type="button" onClick={() => handleRemoveTag(idx)} className="hover:text-red-400">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                  <input
                    type="text"
                    placeholder={tags.length === 0 ? "Add tag..." : ""}
                    className="bg-transparent outline-none flex-1 min-w-[60px]"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleAddTag}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-300 uppercase mb-1">Notes</label>
                <textarea
                  placeholder="Additional details..."
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
export default Expenses;
