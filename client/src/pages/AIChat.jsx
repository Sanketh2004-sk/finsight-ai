import React, { useState, useRef, useEffect } from 'react';
import api from '../services/api';
import { 
  Bot, 
  Send, 
  Sparkles, 
  User, 
  ChevronRight,
  Loader2
} from 'lucide-react';

const SUGGESTIONS = [
  "How much did I spend this month?",
  "Show my top spending categories.",
  "Am I staying within my monthly budget limit?",
  "Give me suggestions to increase my savings rate."
];

export const AIChat = () => {
  const [messages, setMessages] = useState([
    { 
      role: 'assistant', 
      content: 'Hello! I am your AiXpense wealth advisor. Ask me anything about your current budget, category spending, or savings plans.' 
    }
  ]);
  const [inputMsg, setInputMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  const scrollToBottom = () => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSendMessage = async (text) => {
    if (!text.trim() || loading) return;

    const userMessage = { role: 'user', content: text };
    setMessages(prev => [...prev, userMessage]);
    setInputMsg('');
    setLoading(true);

    try {
      const res = await api.post('/ai/chat', {
        messages: [...messages, userMessage]
      });

      if (res.data.success) {
        setMessages(prev => [...prev, { role: 'assistant', content: res.data.reply }]);
      }
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'I encountered an error connecting to my AI processor. Please try again in a moment.' 
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    handleSendMessage(inputMsg);
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col justify-between animate-in fade-in duration-300 gap-4">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight font-heading text-white">
          AI Chat Assistant
        </h1>
        <p className="text-xs text-slate-400 mt-1">Audit and consult about your budget, category metrics, and wealth strategies</p>
      </div>

      {/* Main chat interface grid */}
      <div className="flex-1 glass-panel rounded-2xl border border-glassBorder overflow-hidden flex flex-col justify-between">
        
        {/* Chat log list */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4 max-h-[50vh] sm:max-h-[60vh]">
          {messages.map((msg, idx) => (
            <div 
              key={idx} 
              className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
            >
              {/* Avatar circle */}
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${
                msg.role === 'user' 
                  ? 'bg-slate-900 border-glassBorder text-slate-300' 
                  : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'
              }`}>
                {msg.role === 'user' ? <User className="w-4.5 h-4.5" /> : <Bot className="w-4.5 h-4.5" />}
              </div>

              {/* Chat speech bubble */}
              <div className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-indigo-600 text-white rounded-tr-none'
                  : 'bg-slate-900/60 border border-glassBorder text-slate-100 rounded-tl-none'
              }`}>
                {msg.content}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex gap-3 max-w-[85%]">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <Bot className="w-4.5 h-4.5" />
              </div>
              <div className="p-3.5 bg-slate-900/60 border border-glassBorder rounded-2xl rounded-tl-none flex items-center gap-2 text-xs text-slate-400">
                <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                <span>AI advisor thinking...</span>
              </div>
            </div>
          )}
          <div ref={scrollRef} />
        </div>

        {/* Quick Suggestions & Input controller */}
        <div className="p-4 border-t border-glassBorder bg-slate-950/40 space-y-3">
          
          {/* Suggestion Chips */}
          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.map((text, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(text)}
                disabled={loading}
                className="px-3 py-1.5 rounded-lg bg-slate-900 border border-glassBorder/80 hover:bg-slate-800/40 hover:border-slate-700 text-[10px] text-slate-350 font-semibold transition-all flex items-center gap-1"
              >
                {text} <ChevronRight className="w-3 h-3 text-slate-500" />
              </button>
            ))}
          </div>

          {/* Form message input */}
          <form onSubmit={handleFormSubmit} className="flex gap-2">
            <input
              type="text"
              placeholder="Ask anything about your expenses or budget..."
              value={inputMsg}
              onChange={(e) => setInputMsg(e.target.value)}
              disabled={loading}
              className="flex-1 px-4 py-2.5 text-xs glass-input font-medium"
            />
            <button
              type="submit"
              disabled={!inputMsg.trim() || loading}
              className="px-4 rounded-lg btn-primary text-white flex items-center justify-center transition-all disabled:opacity-50"
            >
              <Send className="w-4.5 h-4.5" />
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};
export default AIChat;
