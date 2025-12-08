import React, { useState, useEffect } from 'react';
import { Navigation } from './Navigation';
import { Overview } from './views/Overview';
import { Attribution } from './views/Attribution';
import { Profitability } from './views/Profitability';
import { Compliance } from './views/Compliance';
import { Settings } from './views/Settings';
import { ViewState } from '../types';
import { Icons } from './ui/Icons';

export const DashboardLayout: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>(ViewState.OVERVIEW);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Scroll to top whenever the view changes to prevent "carry over" of scroll position
  // into empty/black areas of shorter pages.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentView]);

  const renderView = () => {
    switch (currentView) {
      case ViewState.OVERVIEW:
        return <Overview />;
      case ViewState.ATTRIBUTION:
        return <Attribution />;
      case ViewState.PROFITABILITY:
        return <Profitability />;
      case ViewState.COMPLIANCE:
        return <Compliance />;
      case ViewState.SETTINGS:
        return <Settings />;
      default:
        return <Overview />;
    }
  };

  return (
    <div className="min-h-screen bg-[#fafafa] font-sans selection:bg-brand-100 text-slate-600 relative overflow-hidden">
      <Navigation currentView={currentView} onViewChange={setCurrentView} />
      
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-lg border-b border-slate-100 flex items-center justify-between px-4 z-30">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-accent-purple flex items-center justify-center text-white font-bold">V</div>
          <span className="font-semibold text-slate-900">Velocity</span>
        </div>
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 text-slate-500">
          {sidebarOpen ? <Icons.Close size={24} /> : <Icons.Menu size={24} />}
        </button>
      </div>
      
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-20 bg-white pt-20 px-6 md:hidden">
           {/* Mobile nav items would go here, simplified for now */}
           <div className="space-y-4">
              <button onClick={() => { setCurrentView(ViewState.OVERVIEW); setSidebarOpen(false); }} className="block w-full text-left py-2 text-lg font-medium">Overview</button>
              <button onClick={() => { setCurrentView(ViewState.ATTRIBUTION); setSidebarOpen(false); }} className="block w-full text-left py-2 text-lg font-medium">Attribution</button>
              <button onClick={() => { setCurrentView(ViewState.PROFITABILITY); setSidebarOpen(false); }} className="block w-full text-left py-2 text-lg font-medium">Profitability</button>
              <button onClick={() => { setCurrentView(ViewState.COMPLIANCE); setSidebarOpen(false); }} className="block w-full text-left py-2 text-lg font-medium">Compliance</button>
              <button onClick={() => { setCurrentView(ViewState.SETTINGS); setSidebarOpen(false); }} className="block w-full text-left py-2 text-lg font-medium">Settings</button>
           </div>
        </div>
      )}

      <main className="md:pl-64 min-h-screen relative bg-[#fafafa]">
        {/* Top Utility Bar */}
        <header className="h-16 sticky top-0 bg-[#fafafa]/80 backdrop-blur-md z-10 px-8 flex items-center justify-between border-b border-transparent transition-colors duration-200">
          <div className="flex items-center gap-4 text-sm">
             <span className="text-slate-400">Dashboards</span>
             <span className="text-slate-300">/</span>
             <div className="flex items-center gap-2 px-2 py-1 bg-white border border-slate-200 rounded-md shadow-sm cursor-pointer hover:border-slate-300 transition-colors">
                <span className="font-medium text-slate-700">Client: GymShark (DTC)</span>
                <Icons.ChevronDown size={14} className="text-slate-400" />
             </div>
          </div>
          
          <div className="flex items-center gap-4">
             <div className="relative">
                <Icons.Bell size={18} className="text-slate-400 hover:text-slate-600 cursor-pointer transition-colors" />
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-rose-500 rounded-full border border-white"></span>
             </div>
             <div className="h-4 w-px bg-slate-200"></div>
             <div className="flex items-center gap-2 cursor-pointer hover:bg-white px-2 py-1 rounded-md transition-colors">
                <span className="text-sm font-medium text-slate-500">Oct 2025</span>
                <Icons.ChevronDown size={14} className="text-slate-400" />
             </div>
          </div>
        </header>

        <div className="p-4 md:p-8 max-w-7xl mx-auto pb-20">
          {renderView()}
        </div>
      </main>
    </div>
  );
};