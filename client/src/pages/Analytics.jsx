import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  BarElement, 
  ArcElement,
  Title, 
  Tooltip, 
  Legend 
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { 
  Sparkles, 
  FileDown, 
  BarChart2, 
  TrendingUp, 
  CalendarDays,
  Bot
} from 'lucide-react';
import { LoadingSpinner } from '../components/Feedback';

// Register ChartJS modules
ChartJS.register(
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  BarElement, 
  ArcElement,
  Title, 
  Tooltip, 
  Legend
);

export const Analytics = () => {
  const [loading, setLoading] = useState(true);
  const [trendData, setTrendData] = useState(null);
  const [categories, setCategories] = useState([]);
  const [coachReport, setCoachReport] = useState(null);
  const [coachLoading, setCoachLoading] = useState(true);
  
  const [reportMonth, setReportMonth] = useState(new Date().getMonth() + 1);
  const [reportYear, setReportYear] = useState(new Date().getFullYear());
  const [downloading, setDownloading] = useState(false);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const [trendRes, catRes] = await Promise.all([
        api.get('/analytics/monthly-trend'),
        api.get('/analytics/category-breakdown', { params: { months: 3 } }) // last 3 months
      ]);

      if (trendRes.data.success) setTrendData(trendRes.data);
      if (catRes.data.success) setCategories(catRes.data.breakdown);

    } catch (err) {
      console.error('Error fetching analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCoachReport = async () => {
    setCoachLoading(true);
    try {
      const res = await api.get('/ai/spending-coach', { params: { period: 'monthly' } });
      if (res.data.success) {
        setCoachReport(res.data.report);
      }
    } catch (err) {
      console.error('Error getting AI coach report:', err);
    } finally {
      setCoachLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
    fetchCoachReport();
  }, []);

  const handleDownloadPDF = async () => {
    setDownloading(true);
    try {
      const res = await api.get('/reports/monthly', {
        params: { month: reportMonth, year: reportYear },
        responseType: 'blob' // Important: handle binary PDF stream
      });

      // Create blob download link
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `AiXpense_Report_${reportMonth}_${reportYear}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error(err);
      alert('Failed to generate PDF report for the selected month.');
    } finally {
      setDownloading(false);
    }
  };

  // Line Chart config for Income vs Expense
  const lineChartData = trendData ? {
    labels: trendData.labels,
    datasets: [
      {
        label: 'Total Income',
        data: trendData.incomeData,
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.3,
        fill: true,
      },
      {
        label: 'Total Expenses',
        data: trendData.expenseData,
        borderColor: '#ef4444',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        tension: 0.3,
        fill: true,
      }
    ]
  } : null;

  // Doughnut Chart for Categories
  const doughnutChartData = categories.length > 0 ? {
    labels: categories.map(c => c._id),
    datasets: [
      {
        data: categories.map(c => c.total),
        backgroundColor: [
          '#6366f1', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', 
          '#ec4899', '#8b5cf6', '#06b6d4', '#14b8a6', '#64748b'
        ],
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)'
      }
    ]
  } : null;

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: { color: '#94a3b8', font: { size: 10, weight: 'semibold' } }
      }
    },
    scales: {
      x: { grid: { color: 'rgba(255, 255, 255, 0.03)' }, ticks: { color: '#64748b' } },
      y: { grid: { color: 'rgba(255, 255, 255, 0.03)' }, ticks: { color: '#64748b' } }
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight font-heading text-white">
            Analytics & Reports
          </h1>
          <p className="text-xs text-slate-400 mt-1">Audit cash trends and fetch monthly PDF files</p>
        </div>

        {/* PDF Download section */}
        <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
          <select 
            value={reportMonth} 
            onChange={(e) => setReportMonth(parseInt(e.target.value))}
            className="px-3 py-2 text-xs glass-input font-semibold"
          >
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i+1} value={i+1}>
                {new Date(0, i).toLocaleString('en-US', { month: 'long' })}
              </option>
            ))}
          </select>
          <select 
            value={reportYear} 
            onChange={(e) => setReportYear(parseInt(e.target.value))}
            className="px-3 py-2 text-xs glass-input font-semibold"
          >
            {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <button
            onClick={handleDownloadPDF}
            disabled={downloading}
            className="px-4 py-2 rounded-xl btn-primary text-xs font-bold text-white shadow-md flex items-center gap-1.5"
          >
            <FileDown className="w-4 h-4" /> {downloading ? 'Streaming...' : 'Get PDF'}
          </button>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner message="Assembling financial trend lines..." />
      ) : (
        <div className="space-y-6">
          {/* Main Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Trend Chart (Line) */}
            <div className="lg:col-span-2 glass-panel p-5 rounded-2xl border border-glassBorder h-80 flex flex-col justify-between">
              <h2 className="text-xs uppercase font-extrabold text-slate-400 tracking-wider mb-4 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-emerald-400" /> Cash Flow Over Time
              </h2>
              <div className="flex-1 min-h-0 relative">
                {lineChartData && <Line data={lineChartData} options={chartOptions} />}
              </div>
            </div>

            {/* Category Breakdown (Doughnut) */}
            <div className="glass-panel p-5 rounded-2xl border border-glassBorder h-80 flex flex-col justify-between">
              <h2 className="text-xs uppercase font-extrabold text-slate-400 tracking-wider mb-4 flex items-center gap-1.5">
                <BarChart2 className="w-4 h-4 text-indigo-400" /> Category Breakdown
              </h2>
              <div className="flex-1 min-h-0 relative">
                {doughnutChartData ? (
                  <Doughnut 
                    data={doughnutChartData} 
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: { legend: { position: 'right', labels: { color: '#94a3b8', font: { size: 9 } } } }
                    }} 
                  />
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-slate-500">No category data</div>
                )}
              </div>
            </div>

          </div>

          {/* AI Advisor Coaching report */}
          <div className="glass-panel p-6 rounded-2xl border border-glassBorder space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-white font-heading flex items-center gap-2">
                <Bot className="w-5 h-5 text-indigo-400" /> AI Wealth Coach Report
              </h2>
              <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-[9px] font-bold text-indigo-300 border border-indigo-500/20">
                Weekly Summary
              </span>
            </div>

            {coachLoading ? (
              <div className="py-8 flex justify-center">
                <div className="w-5 h-5 border-2 border-indigo-500/25 border-t-indigo-500 rounded-full animate-spin"></div>
              </div>
            ) : coachReport ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Advisor recommendations */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-slate-200">Advisor Recommendations</h3>
                  <div className="space-y-2 text-xs text-slate-350 leading-relaxed font-medium">
                    {coachReport.suggestions?.map((tip, idx) => (
                      <div key={idx} className="flex gap-2 items-start bg-indigo-500/5 border border-indigo-500/10 p-3 rounded-xl">
                        <Sparkles className="w-4.5 h-4.5 text-indigo-400 shrink-0 mt-0.5" />
                        <span>{tip}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Coach diagnostics metrics */}
                <div className="p-4 rounded-xl bg-slate-900/40 border border-glassBorder/60 space-y-4 flex flex-col justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-slate-300 mb-2">Diagnostics Insight</h3>
                    <p className="text-xs text-slate-400 leading-relaxed font-semibold">"{coachReport.summary}"</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-slate-950/60 rounded-xl border border-glassBorder">
                      <span className="text-[9px] text-slate-500 block uppercase font-bold tracking-wider mb-0.5">Overspending</span>
                      <span className="text-xs font-bold text-red-400">
                        {coachReport.overspendingAreas?.join(', ') || 'None'}
                      </span>
                    </div>
                    <div className="p-3 bg-slate-950/60 rounded-xl border border-glassBorder">
                      <span className="text-[9px] text-slate-500 block uppercase font-bold tracking-wider mb-0.5">Progress indicators</span>
                      <span className="text-xs font-bold text-emerald-400">
                        {coachReport.positiveTrends?.join(', ') || 'No trend detected'}
                      </span>
                    </div>
                  </div>
                </div>

              </div>
            ) : (
              <p className="text-xs text-slate-550 text-center py-4">No report insights generated yet. Add transactions to trigger coach analytics.</p>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
export default Analytics;
