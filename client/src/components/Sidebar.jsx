import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Receipt, 
  Wallet, 
  PiggyBank, 
  Target, 
  CalendarRange, 
  Scan, 
  Mic, 
  Bot, 
  BarChart3, 
  UserCog,
  FileSpreadsheet
} from 'lucide-react';

export const Sidebar = ({ isOpen, onClose }) => {
  const menuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Expenses', path: '/expenses', icon: Receipt },
    { name: 'Income', path: '/income', icon: Wallet },
    { name: 'Budgets', path: '/budgets', icon: PiggyBank },
    { name: 'Savings Goals', path: '/goals', icon: Target },
    { name: 'Subscriptions', path: '/subscriptions', icon: CalendarRange },
    { name: 'AI Receipt Scanner', path: '/receipt-scanner', icon: Scan },
    { name: 'Voice Entry', path: '/voice-entry', icon: Mic },
    { name: 'AI Chat Assistant', path: '/ai-chat', icon: Bot },
    { name: 'Analytics & Reports', path: '/analytics', icon: BarChart3 },
    { name: 'Profile Settings', path: '/profile', icon: UserCog },
  ];

  return (
    <>
      {/* Mobile Sidebar Overlay */}
      {isOpen && (
        <div 
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-45 lg:hidden"
        />
      )}

      <aside className={`
        fixed top-16 bottom-0 left-0 w-64 border-r border-glassBorder 
        bg-[#090d16]/95 backdrop-blur-md z-45 transition-transform duration-300
        lg:translate-x-0 lg:bg-[#090d16]/50
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full py-4 justify-between">
          <div className="px-3 space-y-1 overflow-y-auto max-h-[calc(100vh-9rem)]">
            {menuItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={({ isActive }) => `
                  flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-semibold
                  transition-all duration-200 group
                  ${isActive 
                    ? 'bg-indigo-500/10 text-indigo-300 border-l-2 border-indigo-500' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/30'
                  }
                `}
              >
                <item.icon className="w-4 h-4 text-slate-400 group-hover:text-indigo-400 transition-colors" />
                <span>{item.name}</span>
              </NavLink>
            ))}
          </div>

          <div className="px-6 py-2 border-t border-glassBorder/40">
            <div className="text-[10px] text-slate-500 font-semibold text-center">
              AiXpense v1.0.0
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
