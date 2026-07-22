import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Activity, 
  ArrowUpRight, 
  Sparkles, 
  AlertTriangle,
  ChevronRight,
  ShieldCheck,
  CalendarDays
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { LoadingSpinner } from '../components/Feedback';

export const Dashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [healthLoading, setHealthLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      const res = await api.get('/analytics/dashboard');
      if (res.data.success) {
        setData(res.data.dashboard);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchHealthScore = async () => {
    try {
      const res = await api.get('/ai/health-score');
      if (res.data.success) {
        setHealth(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setHealthLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    fetchHealthScore();
  }, []);

  if (loading) {
    return <LoadingSpinner message="Calculating dashboard matrix..." />;
  }

  const {
    totalIncome = 0,
    totalExpenses = 0,
    balance = 0,
    savingsRate = 0,
    expenseChange = 0,
    recentTransactions = [],
    categoryBreakdown = [],
    budget = null
  } = data || {};

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Welcome Banner */}
      <div className="glass-panel p-6 rounded-2xl border border-glassBorder flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight font-heading text-white">
            Hello, {user?.name}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Here is your financial telemetry for {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </p>
        </div>
        
        <div className="flex gap-2 w-full md:w-auto">
          <Link to="/receipt-scanner" className="flex-1 md:flex-none text-center px-4 py-2 rounded-xl bg-indigo-500/10 border border-indigo-500/25 hover:bg-indigo-500/20 text-indigo-300 text-xs font-bold transition-all flex items-center justify-center gap-1.5">
            <Sparkles className="w-4 h-4" /> Scan Receipt
          </Link>
          <Link to="/expenses" className="flex-1 md:flex-none text-center px-4 py-2 rounded-xl btn-primary text-xs font-bold text-white shadow-md flex items-center justify-center gap-1">
            Add Expense <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Income Card */}
        <div className="glass-panel p-5 rounded-2xl border border-glassBorder relative overflow-hidden group hover:border-indigo-500/30 transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-emerald-500/10 transition-all" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Income</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-xl font-extrabold text-white font-heading">
            ₹{totalIncome.toLocaleString('en-IN')}
          </h3>
          <p className="text-[10px] text-slate-500 mt-2">Active cash inflow</p>
        </div>

        {/* Expenses Card */}
        <div className="glass-panel p-5 rounded-2xl border border-glassBorder relative overflow-hidden group hover:border-indigo-500/30 transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-red-500/10 transition-all" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Expense</span>
            <div className="w-7 h-7 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-xl font-extrabold text-white font-heading">
            ₹{totalExpenses.toLocaleString('en-IN')}
          </h3>
          <div className="text-[10px] mt-2 flex items-center gap-1">
            {expenseChange > 0 ? (
              <span className="text-red-400 font-semibold">+{expenseChange}%</span>
            ) : (
              <span className="text-emerald-400 font-semibold">{expenseChange}%</span>
            )}
            <span className="text-slate-500">vs last month</span>
          </div>
        </div>

        {/* Net Balance Card */}
        <div className="glass-panel p-5 rounded-2xl border border-glassBorder relative overflow-hidden group hover:border-indigo-500/30 transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-indigo-500/10 transition-all" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Net Balance</span>
            <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <h3 className={`text-xl font-extrabold font-heading ${balance >= 0 ? 'text-white' : 'text-red-400'}`}>
            ₹{balance.toLocaleString('en-IN')}
          </h3>
          <p className="text-[10px] text-slate-500 mt-2">Available disposable cash</p>
        </div>

        {/* Savings Rate Card */}
        <div className="glass-panel p-5 rounded-2xl border border-glassBorder relative overflow-hidden group hover:border-indigo-500/30 transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-purple-500/10 transition-all" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Savings Rate</span>
            <div className="w-7 h-7 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-xl font-extrabold text-white font-heading">
            {parseFloat(savingsRate).toFixed(1)}%
          </h3>
          <p className="text-[10px] text-slate-500 mt-2">Of income saved</p>
        </div>
      </div>

      {/* Main Grid: Health score vs Budgets / Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Financial Health Score & Quick Analytics */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* AI Financial Health Score Block */}
          <div className="glass-panel p-6 rounded-2xl border border-glassBorder relative overflow-hidden">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-sm font-bold text-white font-heading">AI Financial Health Score</h2>
                <p className="text-[10px] text-slate-400 mt-0.5">Calculated autonomously using savings, limits, and patterns</p>
              </div>
              <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <Sparkles className="w-4.5 h-4.5" />
              </div>
            </div>

            {healthLoading ? (
              <div className="py-6 flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-indigo-500/25 border-t-indigo-500 rounded-full animate-spin"></div>
              </div>
            ) : health ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                {/* Visual Gauge */}
                <div className="flex flex-col items-center justify-center text-center">
                  <div className="relative w-32 h-32 flex items-center justify-center">
                    {/* Circle SVG */}
                    <svg className="w-full h-full transform -rotate-90">
                      <circle 
                        cx="64" cy="64" r="50" 
                        className="stroke-slate-800 fill-none" 
                        strokeWidth="8" 
                      />
                      <circle 
                        cx="64" cy="64" r="50" 
                        className="stroke-indigo-500 fill-none transition-all duration-1000" 
                        strokeWidth="8" 
                        strokeDasharray={314}
                        strokeDashoffset={314 - (314 * health.score) / 100}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute flex flex-col items-center justify-center">
                      <span className="text-3xl font-extrabold text-white font-heading">{health.score}</span>
                      <span className="text-[9px] uppercase font-bold text-indigo-400 tracking-wider">Grade {health.grade}</span>
                    </div>
                  </div>
                </div>

                {/* Score Breakdown factors */}
                <div className="space-y-3">
                  <h4 className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Score Components</h4>
                  <div className="space-y-2 text-xs">
                    <div>
                      <div className="flex justify-between text-[10px] font-semibold text-slate-300 mb-1">
                        <span>Savings Weight</span>
                        <span>{health.factors.savingsRate}/30</span>
                      </div>
                      <div className="h-1.5 bg-slate-900 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500" style={{ width: `${(health.factors.savingsRate / 30) * 100}%` }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-[10px] font-semibold text-slate-300 mb-1">
                        <span>Budget Adherence</span>
                        <span>{health.factors.budgetAdherence}/25</span>
                      </div>
                      <div className="h-1.5 bg-slate-900 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-500" style={{ width: `${(health.factors.budgetAdherence / 25) * 100}%` }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-[10px] font-semibold text-slate-300 mb-1">
                        <span>Spending Stability</span>
                        <span>{health.factors.spendingConsistency}/20</span>
                      </div>
                      <div className="h-1.5 bg-slate-900 rounded-full overflow-hidden">
                        <div className="h-full bg-purple-500" style={{ width: `${(health.factors.spendingConsistency / 20) * 100}%` }}></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* AI Advisor Explanation */}
                <div className="md:border-l md:border-glassBorder/60 md:pl-6 flex flex-col justify-center">
                  <div className="flex gap-2 items-start bg-indigo-500/5 border border-indigo-500/10 p-3 rounded-xl">
                    <ShieldCheck className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-[10px] font-bold text-indigo-300">AI Advisor Insight</h4>
                      <p className="text-[10px] text-slate-300 leading-relaxed mt-1">{health.explanation}</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center text-xs text-slate-500 py-4">
                Configure your Profile metrics to get a Health Score.
              </div>
            )}
          </div>

          {/* Recent Transactions List */}
          <div className="glass-panel p-6 rounded-2xl border border-glassBorder">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-white font-heading">Recent Payments</h2>
              <Link to="/expenses" className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-0.5">
                View All <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-glassBorder/60 text-slate-400 font-semibold">
                    <th className="pb-2">Merchant / Notes</th>
                    <th className="pb-2">Category</th>
                    <th className="pb-2">Date</th>
                    <th className="pb-2 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTransactions.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="text-center text-slate-500 py-6">
                        No transactions logged yet this month.
                      </td>
                    </tr>
                  ) : (
                    recentTransactions.map((tx) => (
                      <tr key={tx._id} className="border-b border-glassBorder/40 hover:bg-slate-800/20 transition-colors">
                        <td className="py-3 font-semibold text-slate-200">
                          <div>{tx.merchant || 'General Payment'}</div>
                          {tx.description && <div className="text-[10px] text-slate-500 font-normal">{tx.description}</div>}
                        </td>
                        <td className="py-3">
                          <span className="px-2 py-0.5 rounded-full bg-slate-800 text-[10px] text-slate-300 border border-slate-700/50">
                            {tx.category}
                          </span>
                        </td>
                        <td className="py-3 text-slate-400">
                          {new Date(tx.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                        </td>
                        <td className={`py-3 text-right font-extrabold ${tx.isFraudulent ? 'text-red-400' : 'text-slate-100'}`}>
                          ₹{tx.amount.toLocaleString('en-IN')}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Monthly Budget status & Category breakdown list */}
        <div className="space-y-6">
          
          {/* Budget Progress Card */}
          <div className="glass-panel p-6 rounded-2xl border border-glassBorder relative overflow-hidden">
            <h2 className="text-sm font-bold text-white font-heading mb-4">Monthly Budget Limit</h2>
            
            {budget ? (
              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider">Used Budget</span>
                    <span className="text-xl font-extrabold text-white font-heading">₹{budget.spent.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider">Limit</span>
                    <span className="text-xs font-bold text-slate-300">₹{budget.totalBudget.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="relative">
                  <div className="h-3 bg-slate-900 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-500 ${
                        parseFloat(budget.percentageUsed) >= 100 
                          ? 'bg-red-500 shadow-lg shadow-red-500/20' 
                          : parseFloat(budget.percentageUsed) >= 80 
                          ? 'bg-amber-500' 
                          : 'bg-indigo-500'
                      }`}
                      style={{ width: `${Math.min(budget.percentageUsed, 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[9px] font-bold text-slate-400 mt-1.5">
                    <span>{budget.percentageUsed}% consumed</span>
                    <span>₹{Math.max(0, budget.remaining).toLocaleString('en-IN')} left</span>
                  </div>
                </div>

                {parseFloat(budget.percentageUsed) >= 80 && (
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[10px] flex gap-2 items-start">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>
                      {parseFloat(budget.percentageUsed) >= 100 
                        ? 'Warning: You have exceeded your monthly spending limit.' 
                        : 'Alert: You are approaching your monthly spending limit limit.'}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-xs text-slate-500 mb-4">No budget configured for this month.</p>
                <Link to="/budgets" className="px-4 py-2 rounded-lg bg-indigo-500/10 border border-indigo-500/25 hover:bg-indigo-500/20 text-indigo-300 text-xs font-bold transition-all inline-flex items-center gap-1">
                  Configure Budget <CalendarDays className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}
          </div>

          {/* Category Breakdown list */}
          <div className="glass-panel p-6 rounded-2xl border border-glassBorder">
            <h2 className="text-sm font-bold text-white font-heading mb-4">Top Spending Categories</h2>

            {categoryBreakdown.length === 0 ? (
              <div className="text-center text-slate-500 text-xs py-8">
                No expense records to analyze.
              </div>
            ) : (
              <div className="space-y-4">
                {categoryBreakdown.slice(0, 6).map((cat) => {
                  const pct = totalExpenses > 0 ? ((cat.total / totalExpenses) * 100).toFixed(1) : 0;
                  return (
                    <div key={cat._id} className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold text-slate-200">
                        <span>{cat._id}</span>
                        <span>₹{cat.total.toLocaleString('en-IN')} <span className="text-[10px] text-slate-500 font-normal">({pct}%)</span></span>
                      </div>
                      <div className="h-1.5 bg-slate-900 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-500/70" style={{ width: `${pct}%` }}></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
export default Dashboard;
