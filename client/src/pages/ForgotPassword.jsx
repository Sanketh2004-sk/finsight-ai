import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { Sparkles, Loader2, AlertCircle, CheckCircle } from 'lucide-react';

export const ForgotPassword = () => {
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = async (data) => {
    setErrorMsg('');
    setLoading(true);
    try {
      const res = await api.post('/auth/forgot-password', { email: data.email });
      if (res.data.success) {
        setSuccess(true);
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to request reset link.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050811] flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md z-10 animate-in fade-in duration-300">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-extrabold tracking-tight font-heading text-white">
              AiXpense
            </span>
          </Link>
          <h2 className="text-lg font-bold text-white font-heading">Reset Password</h2>
          <p className="text-xs text-slate-400 mt-1">We will send a secure link to restore your account</p>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {success ? (
          <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-glassBorder shadow-xl text-center space-y-4">
            <div className="w-12 h-12 bg-indigo-500/10 rounded-full flex items-center justify-center text-indigo-400 mx-auto border border-indigo-500/25">
              <CheckCircle className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-white font-heading">Check Your Email</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              If an account matches that email, a password reset link has been dispatched.
            </p>
            <div className="pt-2">
              <Link to="/login" className="text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors">
                Return to login
              </Link>
            </div>
          </div>
        ) : (
          <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-glassBorder shadow-xl">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Email Address</label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  className="w-full px-4 py-2.5 text-xs glass-input font-medium"
                  {...register('email', { 
                    required: 'Email is required',
                    pattern: { value: /^\S+@\S+\.\S+$/, message: 'Invalid email address' }
                  })}
                />
                {errors.email && (
                  <p className="text-[10px] text-red-400 mt-1 font-semibold">{errors.email.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-lg btn-primary text-xs font-bold text-white flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Sending link...
                  </>
                ) : (
                  'Send Reset Link'
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <Link to="/login" className="text-xs text-slate-400 hover:text-indigo-300 font-bold transition-colors">
                Back to login
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
export default ForgotPassword;
