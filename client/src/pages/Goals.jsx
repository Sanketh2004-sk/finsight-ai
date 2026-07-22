import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useForm } from 'react-hook-form';
import { 
  Plus, 
  Target, 
  Sparkles, 
  Trash2, 
  PlusCircle, 
  Calendar, 
  ShieldAlert,
  ArrowRight,
  TrendingUp,
  X,
  AlertCircle
} from 'lucide-react';
import { LoadingSpinner, EmptyState } from '../components/Feedback';

const CATEGORIES = [
  "Emergency Fund", "Vacation", "Education", "Home", "Vehicle", "Wedding", "Retirement", "Investment", "Other"
];

export const Goals = () => {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [depositModalOpen, setDepositModalOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [aiPlanGoal, setAiPlanGoal] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  const { register, handleSubmit, reset } = useForm();
  const { register: depositRegister, handleSubmit: handleDepositSubmit, reset: depositReset } = useForm();

  const fetchGoals = async () => {
    setLoading(true);
    try {
      const res = await api.get('/goals');
      if (res.data.success) {
        setGoals(res.data.goals);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, []);

  const openAddModal = () => {
    reset({
      title: '',
      description: '',
      targetAmount: '',
      deadline: new Date(Date.now() + 365*24*60*60*1000).toISOString().split('T')[0], // 1 year default
      category: 'Other'
    });
    setErrorMsg('');
    setModalOpen(true);
  };

  const openDepositModal = (goal) => {
    setSelectedGoal(goal);
    depositReset({ amount: '', note: '' });
    setErrorMsg('');
    setDepositModalOpen(true);
  };

  const handleCreateGoal = async (formData) => {
    setSubmitLoading(true);
    setErrorMsg('');
    try {
      const res = await api.post('/goals', formData);
      if (res.data.success) {
        setModalOpen(false);
        fetchGoals();
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to create savings goal.');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDeposit = async (formData) => {
    if (!selectedGoal) return;
    setSubmitLoading(true);
    setErrorMsg('');
    try {
      const res = await api.post(`/goals/${selectedGoal._id}/deposit`, {
        amount: parseFloat(formData.amount),
        note: formData.note
      });
      if (res.data.success) {
        setDepositModalOpen(false);
        fetchGoals();
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Deposit failed.');
    } finally {
      setSubmitLoading(false);
    }
  };

  const triggerAIPlan = async (goal) => {
    setAiLoading(true);
    setAiPlanGoal(goal);
    try {
      const res = await api.post('/ai/goal-plan', { goalId: goal._id });
      if (res.data.success) {
        fetchGoals(); // reload to get plan embedded
      }
    } catch (err) {
      console.error(err);
      alert('AI Planner encountered an error. Please try again.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this goal and deposit history?')) return;
    try {
      const res = await api.delete(`/goals/${id}`);
      if (res.data.success) {
        fetchGoals();
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
            Savings Goals
          </h1>
          <p className="text-xs text-slate-400 mt-1">Define milestones and save money toward accomplishments</p>
        </div>
        <button 
          onClick={openAddModal}
          className="px-5 py-2.5 rounded-xl btn-primary text-xs font-bold text-white shadow-md flex items-center gap-1.5 self-stretch sm:self-auto justify-center"
        >
          <Plus className="w-4 h-4" /> Create Goal
        </button>
      </div>

      {loading ? (
        <LoadingSpinner message="Evaluating milestones..." />
      ) : goals.length === 0 ? (
        <EmptyState 
          title="No Savings Goals yet" 
          description="Create a goal like 'Emergency Fund' or 'New Laptop' to start tracking your savings." 
          icon={Target}
          actionButton={
            <button onClick={openAddModal} className="px-4 py-2 rounded-lg btn-primary text-xs font-bold text-white">
              Create Goal
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {goals.map((goal) => {
            const pct = goal.targetAmount > 0 ? ((goal.currentAmount / goal.targetAmount) * 100).toFixed(1) : 0;
            return (
              <div key={goal._id} className="glass-panel p-5 rounded-2xl border border-glassBorder space-y-4 flex flex-col justify-between">
                
                {/* Top Section Info */}
                <div className="space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-[9px] font-bold text-indigo-300 border border-indigo-500/15">
                        {goal.category}
                      </span>
                      <h3 className="text-sm font-bold text-white font-heading mt-1.5">{goal.title}</h3>
                      {goal.description && <p className="text-[10px] text-slate-500 mt-0.5">{goal.description}</p>}
                    </div>
                    <button 
                      onClick={() => handleDelete(goal._id)}
                      className="p-1 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex justify-between items-baseline text-xs">
                    <span className="font-extrabold text-white text-base">₹{goal.currentAmount.toLocaleString('en-IN')}</span>
                    <span className="text-[10px] text-slate-400 font-bold">Target: ₹{goal.targetAmount.toLocaleString('en-IN')}</span>
                  </div>

                  {/* Progress bar */}
                  <div className="space-y-1">
                    <div className="h-2 bg-slate-900 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-emerald-500 transition-all duration-300"
                        style={{ width: `${Math.min(pct, 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[9px] text-slate-400 font-bold">
                      <span>{pct}% Saved</span>
                      <span>{new Date(goal.deadline).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                    </div>
                  </div>
                </div>

                {/* AI Plan Panel */}
                {goal.aiPlan ? (
                  <div className="p-3 rounded-xl bg-indigo-500/5 border border-indigo-500/10 text-[10px] space-y-2">
                    <div className="flex justify-between items-center text-indigo-300 font-bold">
                      <span className="flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> AI Saving Strategy
                      </span>
                      <span>Target: ₹{goal.aiPlan.monthlyTarget.toFixed(0)}/mo</span>
                    </div>
                    <div className="space-y-1 text-slate-400 font-medium">
                      {goal.aiPlan.suggestions.slice(0, 2).map((s, i) => (
                        <p key={i}>• {s}</p>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-indigo-950/20 border border-indigo-500/10">
                    <span className="text-[10px] text-slate-450 font-semibold">Generate AI plan to achieve deadline</span>
                    <button
                      onClick={() => triggerAIPlan(goal)}
                      disabled={aiLoading && aiPlanGoal?._id === goal._id}
                      className="px-3 py-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/25 hover:bg-indigo-500/20 text-indigo-300 text-[10px] font-bold transition-all flex items-center gap-1"
                    >
                      <Sparkles className="w-3 h-3" /> {aiLoading && aiPlanGoal?._id === goal._id ? 'Generating...' : 'Analyze Goal'}
                    </button>
                  </div>
                )}

                {/* Actions */}
                <div className="pt-2 border-t border-glassBorder/40 flex gap-2">
                  <button
                    onClick={() => openDepositModal(goal)}
                    disabled={goal.status === 'completed'}
                    className="flex-1 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-xs font-bold text-white shadow-md flex items-center justify-center gap-1 transition-all disabled:opacity-40"
                  >
                    <PlusCircle className="w-4 h-4" /> Deposit Savings
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Goal creation Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md glass-panel rounded-2xl border border-glassBorder overflow-hidden animate-in zoom-in-95 duration-200 shadow-2xl">
            <div className="p-5 border-b border-glassBorder flex justify-between items-center bg-slate-900/60">
              <h2 className="text-sm font-bold text-white font-heading">Setup Savings Goal</h2>
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

            <form onSubmit={handleSubmit(handleCreateGoal)} className="p-5 space-y-4">
              <div>
                <label className="block text-[10px] font-semibold text-slate-300 uppercase mb-1">Goal Title</label>
                <input
                  type="text"
                  placeholder="e.g. Dream House, New Car"
                  className="w-full px-3 py-2 text-xs glass-input font-medium"
                  {...register('title', { required: true })}
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-300 uppercase mb-1">Target Amount (₹)</label>
                <input
                  type="number"
                  placeholder="0.00"
                  className="w-full px-3 py-2 text-xs glass-input font-medium"
                  {...register('targetAmount', { required: true, min: 1 })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-300 uppercase mb-1">Deadline Date</label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 text-xs glass-input font-medium"
                    {...register('deadline', { required: true })}
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
                <label className="block text-[10px] font-semibold text-slate-300 uppercase mb-1">Brief Description</label>
                <textarea
                  placeholder="Details about what you are saving for..."
                  rows="2"
                  className="w-full px-3 py-2 text-xs glass-input font-medium resize-none"
                  {...register('description')}
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
                  {submitLoading ? 'Creating...' : 'Establish Goal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Deposit Modal */}
      {depositModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-sm glass-panel rounded-2xl border border-glassBorder overflow-hidden animate-in zoom-in-95 duration-200 shadow-2xl">
            <div className="p-5 border-b border-glassBorder flex justify-between items-center bg-slate-900/60">
              <h2 className="text-sm font-bold text-white font-heading">Add Savings</h2>
              <button onClick={() => setDepositModalOpen(false)} className="p-1 text-slate-400 hover:text-white hover:bg-slate-800/60 rounded-lg">
                <X className="w-4 h-4" />
              </button>
            </div>

            {errorMsg && (
              <div className="m-5 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleDepositSubmit(handleDeposit)} className="p-5 space-y-4">
              <div>
                <label className="block text-[10px] font-semibold text-slate-300 uppercase mb-1">Deposit Amount (₹)</label>
                <input
                  type="number"
                  placeholder="0.00"
                  className="w-full px-3 py-2 text-xs glass-input font-medium"
                  {...depositRegister('amount', { required: true, min: 0.01 })}
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-300 uppercase mb-1">Note (optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Deposited from June Bonus"
                  className="w-full px-3 py-2 text-xs glass-input font-medium"
                  {...depositRegister('note')}
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setDepositModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-900 border border-glassBorder hover:bg-slate-800/40 text-xs font-semibold text-slate-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitLoading}
                  className="px-5 py-2 rounded-lg btn-primary text-xs font-bold text-white disabled:opacity-50"
                >
                  {submitLoading ? 'Depositing...' : 'Confirm Deposit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default Goals;
