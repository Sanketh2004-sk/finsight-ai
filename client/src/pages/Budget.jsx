import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { 
  Plus, 
  PiggyBank, 
  Sparkles, 
  Trash2, 
  AlertTriangle, 
  Edit3,
  Calendar,
  X,
  Check
} from 'lucide-react';
import { LoadingSpinner } from '../components/Feedback';

const CATEGORIES = [
  "Food & Dining", "Shopping", "Transportation", "Entertainment", 
  "Healthcare", "Education", "Utilities", "Rent", "Travel", 
  "Subscriptions", "Groceries", "Fitness", "Personal Care", 
  "Insurance", "Investment", "Gifts & Donations", "Other"
];

export const BudgetPage = () => {
  const [budget, setBudget] = useState(null);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [modalOpen, setModalOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);

  // Form states for creating/editing budget
  const [totalBudget, setTotalBudget] = useState('');
  const [categoryLimits, setCategoryLimits] = useState({});

  const fetchBudget = async () => {
    setLoading(true);
    try {
      const res = await api.get('/budgets', { params: { month, year } });
      if (res.data.success) {
        setBudget(res.data.budget);
        if (res.data.budget) {
          setTotalBudget(res.data.budget.totalBudget);
          const catMap = {};
          res.data.budget.categories.forEach(c => {
            catMap[c.category] = c.limit;
          });
          setCategoryLimits(catMap);
        } else {
          setTotalBudget('');
          setCategoryLimits({});
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBudget();
  }, [month, year]);

  const openConfigModal = () => {
    setErrorMsg('');
    setModalOpen(true);
  };

  const handleCategoryLimitChange = (cat, val) => {
    setCategoryLimits({ ...categoryLimits, [cat]: val === '' ? '' : parseFloat(val) });
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);
    setErrorMsg('');

    // Format category objects
    const categoriesArray = Object.entries(categoryLimits)
      .filter(([_, limit]) => limit !== '' && limit > 0)
      .map(([category, limit]) => ({ category, limit }));

    try {
      const res = await api.post('/budgets', {
        month,
        year,
        totalBudget: parseFloat(totalBudget),
        categories: categoriesArray
      });

      if (res.data.success) {
        setBudget(res.data.budget);
        setModalOpen(false);
        fetchBudget();
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to save budget settings.');
    } finally {
      setSubmitLoading(false);
    }
  };

  const deleteBudget = async () => {
    if (!budget) return;
    if (!window.confirm('Are you sure you want to delete this month\'s budget configuration?')) return;
    
    try {
      const res = await api.delete(`/budgets/${budget._id}`);
      if (res.data.success) {
        setBudget(null);
        setTotalBudget('');
        setCategoryLimits({});
        fetchBudget();
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
            Budget Management
          </h1>
          <p className="text-xs text-slate-400 mt-1">Configure limits to restrict overspending alerts</p>
        </div>
        <div className="flex items-center gap-2 self-stretch sm:self-auto">
          {/* Month/Year selector */}
          <select 
            value={month} 
            onChange={(e) => setMonth(parseInt(e.target.value))}
            className="px-3 py-2 text-xs glass-input font-semibold"
          >
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i+1} value={i+1}>
                {new Date(0, i).toLocaleString('en-US', { month: 'long' })}
              </option>
            ))}
          </select>
          <select 
            value={year} 
            onChange={(e) => setYear(parseInt(e.target.value))}
            className="px-3 py-2 text-xs glass-input font-semibold"
          >
            {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner message="Checking budget configuration..." />
      ) : !budget ? (
        <div className="glass-panel p-12 text-center rounded-2xl border border-glassBorder max-w-lg mx-auto flex flex-col items-center justify-center">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4">
            <PiggyBank className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-white mb-1 font-heading">No Budget Configured</h3>
          <p className="text-xs text-slate-400 max-w-sm mb-6 leading-relaxed">
            You haven't set a budget for this month yet. Configure a budget limit to track expenses in real-time.
          </p>
          <button 
            onClick={openConfigModal}
            className="px-5 py-2.5 rounded-xl btn-primary text-xs font-bold text-white shadow-md flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Setup Monthly Budget
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Budget Overview Card */}
          <div className="glass-panel p-6 rounded-2xl border border-glassBorder h-fit space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-sm font-bold text-white font-heading">Budget Overview</h2>
              <div className="flex items-center gap-1">
                <button onClick={openConfigModal} className="p-1.5 hover:bg-slate-800/40 rounded text-indigo-400">
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
                <button onClick={deleteBudget} className="p-1.5 hover:bg-slate-800/40 rounded text-red-400">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between text-xs font-medium text-slate-400">
                <span>Total Spent</span>
                <span>Limit</span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="text-2xl font-extrabold text-white font-heading">₹{budget.totalSpent?.toLocaleString('en-IN')}</span>
                <span className="text-sm text-slate-400 font-bold">₹{budget.totalBudget?.toLocaleString('en-IN')}</span>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1">
                <div className="h-3 bg-slate-900 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-500 ${
                      parseFloat(budget.percentageUsed) >= 100 
                        ? 'bg-red-500' 
                        : parseFloat(budget.percentageUsed) >= 80 
                        ? 'bg-amber-500' 
                        : 'bg-indigo-500'
                    }`}
                    style={{ width: `${Math.min(budget.percentageUsed, 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-slate-400 font-semibold">
                  <span>{budget.percentageUsed}% used</span>
                  <span>₹{Math.max(0, budget.remaining).toLocaleString('en-IN')} remaining</span>
                </div>
              </div>

              {parseFloat(budget.percentageUsed) >= 80 && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[10px] flex gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>
                    You have spent {budget.percentageUsed}% of your budget. Slow down to avoid overspending!
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Category Budgets Card */}
          <div className="lg:col-span-2 glass-panel p-6 rounded-2xl border border-glassBorder space-y-4">
            <h2 className="text-sm font-bold text-white font-heading">Category Specific Limits</h2>

            {budget.categories.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-500">
                No specific category budgets defined. All expenses will count against the total budget.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {budget.categories.map((cat) => {
                  const pct = cat.limit > 0 ? ((cat.spent / cat.limit) * 100).toFixed(1) : 0;
                  return (
                    <div key={cat._id} className="p-4 rounded-xl bg-slate-900/40 border border-glassBorder/60 space-y-3">
                      <div className="flex justify-between items-center text-xs font-bold text-slate-200">
                        <span>{cat.category}</span>
                        <span>₹{cat.spent.toLocaleString('en-IN')} <span className="text-[10px] text-slate-400 font-normal">/ ₹{cat.limit.toLocaleString('en-IN')}</span></span>
                      </div>
                      <div className="space-y-1">
                        <div className="h-2 bg-slate-950 rounded-full overflow-hidden">
                          <div 
                            className={`h-full transition-all duration-300 ${
                              parseFloat(pct) >= 100 
                                ? 'bg-red-500' 
                                : parseFloat(pct) >= 80 
                                ? 'bg-amber-500' 
                                : 'bg-indigo-500/70'
                            }`}
                            style={{ width: `${Math.min(pct, 100)}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-[9px] text-slate-400 font-semibold">
                          <span>{pct}% spent</span>
                          <span className={parseFloat(pct) >= 100 ? 'text-red-400' : 'text-slate-400'}>
                            {cat.limit - cat.spent >= 0 ? `₹${(cat.limit - cat.spent).toLocaleString('en-IN')} left` : `₹${Math.abs(cat.limit - cat.spent).toLocaleString('en-IN')} over`}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Configuration Form Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-xl glass-panel rounded-2xl border border-glassBorder overflow-hidden animate-in zoom-in-95 duration-200 shadow-2xl">
            <div className="p-5 border-b border-glassBorder flex justify-between items-center bg-slate-900/60">
              <h2 className="text-sm font-bold text-white font-heading">
                Configure Budget Limit
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

            <form onSubmit={handleFormSubmit} className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
              <div>
                <label className="block text-[10px] font-semibold text-slate-300 uppercase mb-1">Total Monthly Budget (₹)</label>
                <input
                  type="number"
                  placeholder="e.g. 50000"
                  className="w-full px-3 py-2 text-xs glass-input font-medium"
                  value={totalBudget}
                  onChange={(e) => setTotalBudget(e.target.value)}
                  required
                />
              </div>

              <div>
                <h4 className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Category Limits (Optional)</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {CATEGORIES.map(cat => (
                    <div key={cat} className="flex items-center gap-2 justify-between">
                      <span className="text-xs font-semibold text-slate-350 line-clamp-1">{cat}</span>
                      <input
                        type="number"
                        placeholder="Limit (₹)"
                        className="w-28 px-2 py-1 text-xs glass-input text-right font-medium"
                        value={categoryLimits[cat] === undefined ? '' : categoryLimits[cat]}
                        onChange={(e) => handleCategoryLimitChange(cat, e.target.value)}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-glassBorder/40 flex justify-end gap-3">
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
                  {submitLoading ? 'Saving...' : 'Save Configuration'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default BudgetPage;
