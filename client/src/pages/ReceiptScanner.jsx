import React, { useState } from 'react';
import api from '../services/api';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { 
  Scan, 
  Upload, 
  Sparkles, 
  Check, 
  AlertCircle, 
  Image as ImageIcon,
  Edit,
  Loader2
} from 'lucide-react';

const CATEGORIES = [
  "Food & Dining", "Shopping", "Transportation", "Entertainment", 
  "Healthcare", "Education", "Utilities", "Rent", "Travel", 
  "Subscriptions", "Groceries", "Fitness", "Personal Care", 
  "Insurance", "Investment", "Gifts & Donations", "Other"
];

const PAYMENT_METHODS = [
  "Cash", "Credit Card", "Debit Card", "UPI", "Net Banking", "Wallet", "Other"
];

export const ReceiptScanner = () => {
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [scanLoading, setScanLoading] = useState(false);
  const [extractedData, setExtractedData] = useState(null);
  const [saveLoading, setSaveLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const { register, handleSubmit, reset } = useForm();

  const handleFileChange = (e) => {
    setErrorMsg('');
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setExtractedData(null);
    }
  };

  const handleScanSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      setErrorMsg('Please select a receipt image first.');
      return;
    }

    setScanLoading(true);
    setErrorMsg('');
    const formData = new FormData();
    formData.append('receipt', selectedFile);

    try {
      const res = await api.post('/ai/scan-receipt', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data.success) {
        setExtractedData(res.data.extracted);
        reset({
          amount: res.data.extracted.amount || '',
          merchant: res.data.extracted.merchant || '',
          category: res.data.extracted.category || 'Food & Dining',
          date: res.data.extracted.date || new Date().toISOString().split('T')[0],
          paymentMethod: res.data.extracted.paymentMethod || 'UPI',
          tax: res.data.extracted.tax || 0,
          description: `Extracted from receipt at ${res.data.extracted.merchant || 'Merchant'}`,
          receiptUrl: res.data.receiptUrl
        });
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'AI scanner failed to extract text from receipt.');
    } finally {
      setScanLoading(false);
    }
  };

  const handleSaveExpense = async (formData) => {
    setSaveLoading(true);
    setErrorMsg('');
    try {
      const payload = {
        amount: parseFloat(formData.amount),
        category: formData.category,
        date: formData.date,
        merchant: formData.merchant,
        paymentMethod: formData.paymentMethod,
        tax: parseFloat(formData.tax) || 0,
        description: formData.description,
        receipt: {
          url: formData.receiptUrl || ''
        },
        aiExtracted: true,
        aiConfidence: extractedData?.confidence || 0.9
      };

      const res = await api.post('/expenses', payload);
      if (res.data.success) {
        setSuccessMsg('Expense logged and verified successfully.');
        setTimeout(() => navigate('/expenses'), 1500);
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to save expense record.');
    } finally {
      setSaveLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight font-heading text-white">
          AI Receipt Scanner
        </h1>
        <p className="text-xs text-slate-400 mt-1">Upload files and let Gemini Vision extract expense records automatically</p>
      </div>

      {errorMsg && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
          <Check className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Column: Image upload box */}
        <div className="glass-panel p-6 rounded-2xl border border-glassBorder flex flex-col justify-between h-fit">
          <form onSubmit={handleScanSubmit} className="space-y-6">
            <h2 className="text-sm font-bold text-white font-heading">Upload Receipt</h2>
            
            <div className="border-2 border-dashed border-glassBorder hover:border-indigo-500/40 rounded-xl p-8 text-center transition-all cursor-pointer relative bg-slate-900/10">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              {previewUrl ? (
                <div className="space-y-3">
                  <img src={previewUrl} alt="Receipt preview" className="max-h-60 mx-auto rounded-lg object-contain border border-glassBorder" />
                  <p className="text-[10px] text-slate-400 font-semibold">{selectedFile?.name}</p>
                </div>
              ) : (
                <div className="space-y-3 flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full bg-indigo-500/5 border border-indigo-500/10 flex items-center justify-center text-indigo-400">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">Drag & drop or click to upload</p>
                    <p className="text-[10px] text-slate-500 mt-1">Supports PNG, JPG, JPEG, up to 10MB</p>
                  </div>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={!selectedFile || scanLoading}
              className="w-full py-2.5 px-4 rounded-lg btn-primary text-xs font-bold text-white flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {scanLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Gemini Vision scanning...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" /> Scan Receipt
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Column: Extracted Review Form */}
        <div className="glass-panel p-6 rounded-2xl border border-glassBorder">
          <h2 className="text-sm font-bold text-white font-heading mb-4">Verification Form</h2>

          {!extractedData ? (
            <div className="h-64 flex flex-col items-center justify-center text-center text-slate-500">
              <Scan className="w-10 h-10 mb-2 stroke-[1.5]" />
              <p className="text-xs">Upload and scan your bill receipt. The extracted data form will appear here for verification.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit(handleSaveExpense)} className="space-y-4 animate-in fade-in duration-300">
              <input type="hidden" {...register('receiptUrl')} />
              <div className="p-3 rounded-lg bg-indigo-500/5 border border-indigo-500/10 flex items-center justify-between text-[10px] text-indigo-300 font-bold mb-2">
                <span>Confidence Score: {(extractedData.confidence * 100).toFixed(0)}%</span>
                <span className="flex items-center gap-0.5"><Sparkles className="w-3.5 h-3.5" /> AI Extracted</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-350 uppercase mb-1">Amount (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full px-3 py-2 text-xs glass-input font-medium"
                    {...register('amount', { required: true })}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-355 uppercase mb-1">Tax (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full px-3 py-2 text-xs glass-input font-medium"
                    {...register('tax')}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-300 uppercase mb-1">Merchant</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 text-xs glass-input font-medium"
                  {...register('merchant', { required: true })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-300 uppercase mb-1">Category</label>
                  <select
                    className="w-full px-3 py-2 text-xs glass-input font-medium"
                    {...register('category', { required: true })}
                  >
                    {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
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
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-300 uppercase mb-1">Payment Method</label>
                <select
                  className="w-full px-3 py-2 text-xs glass-input font-medium"
                  {...register('paymentMethod', { required: true })}
                >
                  {PAYMENT_METHODS.map(method => <option key={method} value={method}>{method}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-300 uppercase mb-1">Description</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 text-xs glass-input font-medium"
                  {...register('description')}
                />
              </div>

              <button
                type="submit"
                disabled={saveLoading}
                className="w-full py-2.5 px-4 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-xs font-bold text-white flex items-center justify-center gap-2 disabled:opacity-50 shadow-md shadow-emerald-500/10 mt-2"
              >
                {saveLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" /> Verify and Save Expense
                  </>
                )}
              </button>
            </form>
          )}
        </div>

      </div>
    </div>
  );
};
export default ReceiptScanner;
