import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { FiDownload, FiFileText, FiCalendar, FiCheckCircle, FiXCircle } from 'react-icons/fi';

export const Reports = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [reportMonth, setReportMonth] = useState(new Date().getMonth() + 1);
  const [reportYear, setReportYear] = useState(new Date().getFullYear());
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchReports = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/reports');
      if (data.success) {
        setReports(data.data);
      }
    } catch (err) {
      console.error('Error fetching reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleGenerateReport = async (e) => {
    e.preventDefault();
    setGenerating(true);
    setError('');
    setSuccess('');

    try {
      const { data } = await api.post('/reports/generate', {
        month: reportMonth,
        year: reportYear
      });

      if (data.success) {
        setSuccess('Report generated successfully. You will receive an email shortly.');
        fetchReports(); // Refresh the list
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate report');
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = async (reportId) => {
    try {
      const { data } = await api.get(`/reports/${reportId}/download`);
      if (data.success && data.data.fileUrl) {
        window.open(data.data.fileUrl, '_blank');
      }
    } catch (err) {
      console.error('Error downloading report:', err);
      setError('Failed to download report. It may no longer be available.');
    }
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold font-outfit text-white">Financial Reports</h1>
        <p className="text-white/60 mt-1">Generate and view your monthly financial summaries.</p>
      </header>

      {error && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-4 rounded-xl flex items-center gap-3">
          <FiXCircle className="w-5 h-5" />
          <p>{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-emerald-500/10 border border-emerald-500/50 text-emerald-500 p-4 rounded-xl flex items-center gap-3">
          <FiCheckCircle className="w-5 h-5" />
          <p>{success}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Generate Report Card */}
        <div className="lg:col-span-1">
          <div className="glass-card p-6">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <FiFileText className="text-primary-400" />
              Generate New Report
            </h2>
            <form onSubmit={handleGenerateReport} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/70 mb-1">Month</label>
                <select
                  value={reportMonth}
                  onChange={(e) => setReportMonth(Number(e.target.value))}
                  className="input-field"
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                    <option key={m} value={m} className="bg-slate-800">
                      {new Date(0, m - 1).toLocaleString('default', { month: 'long' })}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-white/70 mb-1">Year</label>
                <select
                  value={reportYear}
                  onChange={(e) => setReportYear(Number(e.target.value))}
                  className="input-field"
                >
                  {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map((y) => (
                    <option key={y} value={y} className="bg-slate-800">{y}</option>
                  ))}
                </select>
              </div>
              <button
                type="submit"
                disabled={generating}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                {generating ? (
                  <span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <FiFileText />
                    Generate Report
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Previous Reports List */}
        <div className="lg:col-span-2">
          <div className="glass-card p-6 min-h-[400px]">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <FiCalendar className="text-primary-400" />
              Past Reports
            </h2>
            
            {loading ? (
              <div className="flex items-center justify-center h-48">
                <div className="w-8 h-8 border-4 border-primary-500/20 border-t-primary-500 rounded-full animate-spin" />
              </div>
            ) : reports.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 text-white/60 text-sm">
                      <th className="pb-3 font-medium">Period</th>
                      <th className="pb-3 font-medium">Generated On</th>
                      <th className="pb-3 font-medium">Status</th>
                      <th className="pb-3 font-medium text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {reports.map((report) => (
                      <tr key={report._id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <td className="py-4 text-white">
                          {new Date(0, report.month - 1).toLocaleString('default', { month: 'long' })} {report.year}
                        </td>
                        <td className="py-4 text-white/70">
                          {new Date(report.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            report.status === 'completed' 
                              ? 'bg-emerald-500/10 text-emerald-400' 
                              : report.status === 'failed'
                              ? 'bg-red-500/10 text-red-400'
                              : 'bg-yellow-500/10 text-yellow-400'
                          }`}>
                            {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                          </span>
                        </td>
                        <td className="py-4 text-right">
                          <button
                            onClick={() => handleDownload(report._id)}
                            disabled={report.status !== 'completed'}
                            className="p-2 text-white/70 hover:text-primary-400 hover:bg-primary-500/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Download PDF"
                          >
                            <FiDownload className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-48 text-white/50">
                <FiFileText className="w-12 h-12 mb-3 opacity-50" />
                <p>No reports generated yet</p>
                <p className="text-sm mt-1">Use the form to generate your first report.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
