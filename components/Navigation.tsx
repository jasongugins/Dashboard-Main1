import React from 'react';
import { ViewState } from '../types';
import { Icons } from './ui/Icons';

interface NavigationProps {
  currentView: ViewState;
  onViewChange: (view: ViewState) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ currentView, onViewChange }) => {
  const navItems = [
    { id: ViewState.OVERVIEW, label: 'Overview', icon: Icons.Dashboard },
    { id: ViewState.ATTRIBUTION, label: 'Attribution', icon: Icons.Attribution },
    { id: ViewState.PROFITABILITY, label: 'Profitability', icon: Icons.Profitability },
    { id: ViewState.COMPLIANCE, label: 'Compliance', icon: Icons.Compliance },
    { id: ViewState.SETTINGS, label: 'Settings', icon: Icons.Settings },
  ];

  return (
    <aside className="w-64 bg-white/50 backdrop-blur-xl border-r border-slate-100 h-screen fixed left-0 top-0 z-20 flex flex-col hidden md:flex">
      <div className="p-6 flex items-center gap-3 mb-6">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-accent-purple flex items-center justify-center text-white font-bold shadow-glow">
          V
        </div>
        <span className="font-semibold text-slate-800 tracking-tight">Velocity Intel.</span>
      </div>

      <nav className="flex-1 px-4 space-y-1">
        {navItems.map((item) => {
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all duration-200 group relative
                ${isActive 
                  ? 'text-brand-600 bg-brand-50/80 font-medium' 
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                }`}
            >
              <item.icon 
                size={18} 
                className={`transition-colors duration-200 ${isActive ? 'text-brand-600' : 'text-slate-400 group-hover:text-slate-600'}`} 
                strokeWidth={2}
              />
              {item.label}
              
              {isActive && (
                <div className="absolute right-2 w-1.5 h-1.5 rounded-full bg-brand-500 shadow-[0_0_8px_rgba(14,165,233,0.6)]" />
              )}
            </button>
          );
        })}
      </nav>

      <div className="p-4 mt-auto border-t border-slate-100">
        <div className="flex items-center gap-3 px-4 py-2">
          <img 
            src="https://picsum.photos/40/40" 
            alt="User" 
            className="w-8 h-8 rounded-full border border-slate-200"
          />
          <div className="flex flex-col">
            <span className="text-xs font-medium text-slate-700">Alex Chen</span>
            <span className="text-[10px] text-slate-400">Head of Performance</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
