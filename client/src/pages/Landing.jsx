import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight, TrendingUp, ShieldCheck, BrainCircuit, Mic, FileText } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export const Landing = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-[#050811] text-slate-100 flex flex-col justify-between overflow-x-hidden relative">
      {/* Background glow meshes */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[20%] right-[-10%] w-[60%] h-[60%] bg-purple-500/5 rounded-full blur-[140px] pointer-events-none" />

      {/* Header */}
      <header className="max-w-7xl mx-auto w-full px-6 h-20 flex items-center justify-between z-10 border-b border-glassBorder/40">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="text-2xl font-extrabold tracking-tight font-heading bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
            AiXpense
          </span>
        </div>
        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <Link to="/dashboard" className="px-5 py-2.5 rounded-xl btn-primary text-xs font-bold text-white flex items-center gap-1.5">
              Dashboard <ArrowRight className="w-4 h-4" />
            </Link>
          ) : (
            <>
              <Link to="/login" className="text-xs font-bold text-slate-300 hover:text-white transition-colors">
                Sign In
              </Link>
              <Link to="/register" className="px-5 py-2.5 rounded-xl btn-primary text-xs font-bold text-white shadow-md">
                Get Started
              </Link>
            </>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto w-full px-6 flex-1 flex flex-col items-center justify-center text-center py-20 z-10 relative">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold mb-6 animate-pulse">
          <Sparkles className="w-3.5 h-3.5" />
          Next-Gen AI Finance Management
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight max-w-3xl leading-[1.1] mb-6 font-heading text-white">
          Manage your wealth with <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-indigo-400 via-indigo-500 to-purple-500 bg-clip-text text-transparent">
            Autonomous AI
          </span>
        </h1>

        <p className="text-slate-400 max-w-xl text-sm sm:text-base mb-8 leading-relaxed">
          AiXpense reads receipt snapshots, processes multilingual voice notes, predicts future costs, flags financial fraud, and crafts visual wealth reports.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 mb-20">
          <Link 
            to={isAuthenticated ? "/dashboard" : "/register"} 
            className="px-8 py-3.5 rounded-xl btn-primary text-sm font-bold text-white flex items-center justify-center gap-2"
          >
            Start Free Account <ArrowRight className="w-4 h-4" />
          </Link>
          <a 
            href="#features" 
            className="px-8 py-3.5 rounded-xl bg-slate-900/60 border border-glassBorder hover:bg-slate-800/40 hover:border-slate-700 text-sm font-bold text-slate-300 hover:text-white flex items-center justify-center transition-all"
          >
            Explore AI Features
          </a>
        </div>

        {/* Feature Grid */}
        <section id="features" className="w-full pt-12 border-t border-glassBorder/40">
          <h2 className="text-xl sm:text-2xl font-bold mb-10 text-white font-heading text-center">
            Fintech Powered by Intelligence
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            <div className="glass-panel p-6 rounded-2xl border border-glassBorder flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/25 flex items-center justify-center text-indigo-400 mb-4">
                  <BrainCircuit className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-white mb-2 font-heading">AI Receipt Scanner</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Upload a photo of your receipt and let Gemini Vision extract details (merchant, total, taxes, tags) in a few seconds.
                </p>
              </div>
            </div>

            <div className="glass-panel p-6 rounded-2xl border border-glassBorder flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/25 flex items-center justify-center text-indigo-400 mb-4">
                  <Mic className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-white mb-2 font-heading">Voice Expense Logger</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Speak naturally to record expenses in English, Hindi, Tamil, Telugu, or Marathi. Sarvam AI parses the language correctly.
                </p>
              </div>
            </div>

            <div className="glass-panel p-6 rounded-2xl border border-glassBorder flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/25 flex items-center justify-center text-indigo-400 mb-4">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-white mb-2 font-heading">Predictive Wealth Planning</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Generate spending predictions, check real-time financial health scores (0-100), and access customized wealth strategies.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto w-full px-6 py-8 border-t border-glassBorder/40 text-center text-xs text-slate-500 z-10 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>&copy; {new Date().getFullYear()} AiXpense Corp. All rights reserved.</div>
        <div className="flex gap-4">
          <Link to="/login" className="hover:text-slate-300 transition-colors">Privacy Policy</Link>
          <Link to="/login" className="hover:text-slate-300 transition-colors">Terms of Service</Link>
        </div>
      </footer>
    </div>
  );
};
export default Landing;
