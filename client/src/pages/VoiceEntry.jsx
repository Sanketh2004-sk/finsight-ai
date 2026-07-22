import React, { useState, useRef } from 'react';
import api from '../services/api';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { 
  Mic, 
  Square, 
  Sparkles, 
  Check, 
  AlertCircle, 
  Volume2,
  Loader2,
  Trash2
} from 'lucide-react';

const LANGUAGES = [
  { code: "en-IN", name: "English (India)" },
  { code: "hi-IN", name: "Hindi (हिंदी)" },
  { code: "mr-IN", name: "Marathi (मराठी)" },
  { code: "te-IN", name: "Telugu (తెలుగు)" },
  { code: "ta-IN", name: "Tamil (தமிழ்)" }
];

const CATEGORIES = [
  "Food & Dining", "Shopping", "Transportation", "Entertainment", 
  "Healthcare", "Education", "Utilities", "Rent", "Travel", 
  "Subscriptions", "Groceries", "Fitness", "Personal Care", 
  "Insurance", "Investment", "Gifts & Donations", "Other"
];

const PAYMENT_METHODS = [
  "Cash", "Credit Card", "Debit Card", "UPI", "Net Banking", "Wallet", "Other"
];

export const VoiceEntry = () => {
  const navigate = useNavigate();
  const [language, setLanguage] = useState('en-IN');
  const [recording, setRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const [audioBlob, setAudioBlob] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [voiceResult, setVoiceResult] = useState(null);
  const [saveLoading, setSaveLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  const { register, handleSubmit, reset } = useForm();

  const startRecording = async () => {
    setErrorMsg('');
    setVoiceResult(null);
    setAudioUrl(null);
    setAudioBlob(null);
    chunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Use standard supported formats, fallback if wav not supported
      const options = { mimeType: 'audio/webm' };
      const mediaRecorder = new MediaRecorder(stream, options);
      
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        // Stop all track streams
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setRecording(true);
    } catch (err) {
      console.error(err);
      setErrorMsg('Microphone access denied or unsupported browser.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  const discardAudio = () => {
    setAudioBlob(null);
    setAudioUrl(null);
    setVoiceResult(null);
  };

  const processVoiceInput = async () => {
    if (!audioBlob) return;

    setProcessing(true);
    setErrorMsg('');
    const formData = new FormData();
    // Convert audio to file format
    const audioFile = new File([audioBlob], 'audio.webm', { type: 'audio/webm' });
    formData.append('statement', audioFile); // field matches bank statement upload / audio parser
    formData.append('language', language);

    try {
      // Direct call to Sarvam and OpenAI parsing route
      const res = await api.post('/ai/voice-entry', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data.success) {
        setVoiceResult(res.data);
        reset({
          amount: res.data.amount || '',
          merchant: res.data.merchant || '',
          category: res.data.category || 'Food & Dining',
          date: res.data.date || new Date().toISOString().split('T')[0],
          paymentMethod: 'UPI',
          description: res.data.description || 'Voice Entry Payment'
        });
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Voice parsing failed. Speak clearly and retry.');
    } finally {
      setProcessing(false);
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
        description: formData.description,
        aiExtracted: true,
        aiConfidence: voiceResult?.confidence || 0.85
      };

      const res = await api.post('/expenses', payload);
      if (res.data.success) {
        setSuccessMsg('Expense logged from voice note successfully.');
        setTimeout(() => navigate('/expenses'), 1500);
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to save voice expense.');
    } finally {
      setSaveLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight font-heading text-white">
          Voice Expense Entry
        </h1>
        <p className="text-xs text-slate-400 mt-1">Speak details in your local language to parse transaction items via Sarvam AI</p>
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
        
        {/* Recording section */}
        <div className="glass-panel p-6 rounded-2xl border border-glassBorder space-y-6 flex flex-col justify-between h-fit">
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-white font-heading">Capture Audio Note</h2>
            
            <div className="flex gap-2">
              <label className="text-xs font-semibold text-slate-350 self-center">Spoken Language:</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="px-3 py-1.5 text-xs glass-input font-medium flex-1"
                disabled={recording || processing}
              >
                {LANGUAGES.map(lang => <option key={lang.code} value={lang.code}>{lang.name}</option>)}
              </select>
            </div>

            {/* Visual Mic Button */}
            <div className="flex flex-col items-center justify-center py-10 border border-glassBorder/40 rounded-xl bg-slate-900/10 space-y-3">
              {recording ? (
                <button
                  onClick={stopRecording}
                  className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 animate-pulse"
                >
                  <Square className="w-6 h-6 fill-red-400" />
                </button>
              ) : (
                <button
                  onClick={startRecording}
                  disabled={processing}
                  className="w-16 h-16 rounded-full bg-indigo-500/10 border border-indigo-500/20 hover:bg-indigo-500/20 flex items-center justify-center text-indigo-400 transition-all"
                >
                  <Mic className="w-6 h-6" />
                </button>
              )}
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                {recording ? 'Recording voice note... click stop' : 'Tap to start speaking'}
              </span>
            </div>

            {/* Audio playback controls */}
            {audioUrl && (
              <div className="p-3 rounded-xl bg-slate-900/40 border border-glassBorder flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-slate-300">
                  <Volume2 className="w-4 h-4 shrink-0" />
                  <audio src={audioUrl} controls className="h-6 max-w-full" />
                </div>
                <button 
                  onClick={discardAudio}
                  className="p-2 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 rounded-lg text-red-400 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          <button
            onClick={processVoiceInput}
            disabled={!audioBlob || processing}
            className="w-full py-2.5 px-4 rounded-lg btn-primary text-xs font-bold text-white flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {processing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Analyzing voice entities...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" /> Parse Spoken Expense
              </>
            )}
          </button>
        </div>

        {/* Verification Form section */}
        <div className="glass-panel p-6 rounded-2xl border border-glassBorder">
          <h2 className="text-sm font-bold text-white font-heading mb-4">Verification Form</h2>

          {!voiceResult ? (
            <div className="h-64 flex flex-col items-center justify-center text-center text-slate-500">
              <Mic className="w-10 h-10 mb-2 stroke-[1.5]" />
              <p className="text-xs max-w-xs leading-relaxed">
                Click record and describe your payment. Example: "I spent ₹250 on lunch today."
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit(handleSaveExpense)} className="space-y-4 animate-in fade-in duration-300">
              <div className="p-3 rounded-lg bg-indigo-500/5 border border-indigo-500/10 space-y-1.5 text-[10px] text-indigo-300 font-bold mb-2">
                <span className="flex items-center gap-1 font-extrabold uppercase tracking-wide">
                  <Volume2 className="w-4 h-4 text-indigo-400" /> Transcribed Text:
                </span>
                <p className="text-slate-200 italic font-medium">"{voiceResult.transcript}"</p>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-350 uppercase mb-1">Amount (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  className="w-full px-3 py-2 text-xs glass-input font-medium"
                  {...register('amount', { required: true })}
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-300 uppercase mb-1">Merchant</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 text-xs glass-input font-medium"
                    {...register('merchant')}
                  />
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
                className="w-full py-2.5 px-4 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-xs font-bold text-white flex items-center justify-center gap-2 disabled:opacity-50 shadow-md mt-2"
              >
                {saveLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" /> Save Verified Expense
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
export default VoiceEntry;
