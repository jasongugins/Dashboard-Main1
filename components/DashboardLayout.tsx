import React, { useEffect, useRef, useState } from 'react';
import { Navigation } from './Navigation';
import { Overview } from './views/Overview';
import { Attribution } from './views/Attribution';
import { Profitability } from './views/Profitability';
import { Compliance } from './views/Compliance';
import { Settings } from './views/Settings';
import { Client, ViewState } from '../types';
import { Icons } from './ui/Icons';

export const DashboardLayout: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>(ViewState.OVERVIEW);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [clientMenuOpen, setClientMenuOpen] = useState(false);
  const buildRange = (key: '7d' | '30d' | '12m' | 'all') => {
    const end = new Date();
    const toStr = (d: Date) => d.toISOString().slice(0, 10);
    if (key === 'all') {
      return { startDate: undefined, endDate: toStr(end), label: 'All Time' };
    }
    const start = new Date(end);
    if (key === '7d') start.setDate(end.getDate() - 7);
    else if (key === '30d') start.setDate(end.getDate() - 30);
    else if (key === '12m') start.setDate(end.getDate() - 365);
    return { startDate: toStr(start), endDate: toStr(end), label: key === '7d' ? 'Last 7 Days' : key === '30d' ? 'Last 30 Days' : 'Last 12 Months' };
  };
  const [dateRange, setDateRange] = useState(() => buildRange('30d'));
  const [dateRangeKey, setDateRangeKey] = useState<'7d' | '30d' | '12m' | 'all'>('30d');

  const clients: Client[] = [
    { id: 'gymshark', name: 'GymShark (DTC)', segment: 'Athleisure' },
    { id: 'nomad', name: 'Nomad Travel Co.', segment: 'Travel' },
    { id: 'aurora', name: 'Aurora Skincare', segment: 'Beauty' },
    { id: 'forge', name: 'Forge Tools', segment: 'Hardware' },
  ];

  const [selectedClients, setSelectedClients] = useState<string[]>([clients[0].id]);
  const clientMenuRef = useRef<HTMLDivElement>(null);

  // Scroll to top whenever the view changes to prevent "carry over" of scroll position
  // into empty/black areas of shorter pages.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentView]);

  // Close client menu on outside click
  useEffect(() => {
    if (!clientMenuOpen) return;
    const handleClick = (event: MouseEvent) => {
      if (clientMenuRef.current && !clientMenuRef.current.contains(event.target as Node)) {
        setClientMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [clientMenuOpen]);

  const toggleClient = (clientId: string) => {
    setSelectedClients((prev) => {
      if (prev.includes(clientId)) {
        if (prev.length === 1) return prev; // keep at least one selected
        return prev.filter((id) => id !== clientId);
      }
      return [...prev, clientId];
    });
  };

  const selectAll = () => setSelectedClients(clients.map((c) => c.id));

  const selectedClientNames = clients
    .filter((client) => selectedClients.includes(client.id))
    .map((client) => client.name);

  const primaryClientId = selectedClients[0] || clients[0].id;
  const primaryClientName = selectedClientNames[0] || clients.find((c) => c.id === primaryClientId)?.name;

  const clientSummary = () => {
    if (selectedClients.length === clients.length) return 'All clients';
    if (selectedClientNames.length <= 2) return selectedClientNames.join(', ');
    const [first, second, ...rest] = selectedClientNames;
    return `${first}, ${second} +${rest.length}`;
  };

  const renderView = () => {
    switch (currentView) {
      case ViewState.OVERVIEW:
        return <Overview clientId={primaryClientId} dateRange={dateRange} />;
      case ViewState.ATTRIBUTION:
        return <Attribution />;
      case ViewState.PROFITABILITY:
        return <Profitability clientId={primaryClientId} />;
      case ViewState.COMPLIANCE:
        return <Compliance />;
      case ViewState.SETTINGS:
        return <Settings clientId={primaryClientId} clientName={primaryClientName} />;
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
             <div className="relative" ref={clientMenuRef}>
                <button
                  onClick={() => setClientMenuOpen((open) => !open)}
                  className="flex items-center gap-2 px-2 py-1 bg-white border border-slate-200 rounded-md shadow-sm hover:border-slate-300 transition-colors"
                >
                  <span className="font-medium text-slate-700">Clients: {clientSummary()}</span>
                  <span className="text-[10px] font-semibold text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full border border-brand-100">
                    {selectedClients.length}
                  </span>
                  <Icons.ChevronDown size={14} className={`text-slate-400 transition-transform ${clientMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {clientMenuOpen && (
                  <div className="absolute mt-2 w-64 bg-white border border-slate-200 rounded-lg shadow-xl p-3 z-20">
                    <div className="flex items-center justify-between mb-2 text-[11px] text-slate-500">
                      <span>Select clients</span>
                      <button onClick={selectAll} className="text-brand-600 hover:text-brand-700 font-semibold">Select all</button>
                    </div>
                    <div className="space-y-2 max-h-64 overflow-auto pr-1">
                      {clients.map((client) => {
                        const checked = selectedClients.includes(client.id);
                        return (
                          <label
                            key={client.id}
                            className="flex items-center gap-2 text-sm text-slate-700 px-2 py-1 rounded-md hover:bg-slate-50 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleClient(client.id)}
                              className="accent-brand-600"
                            />
                            <div className="flex flex-col leading-tight">
                              <span className="font-medium">{client.name}</span>
                              {client.segment && <span className="text-[11px] text-slate-400">{client.segment}</span>}
                            </div>
                          </label>
                        );
                      })}
                    </div>
                    <div className="mt-3 text-[11px] text-slate-400 flex items-center gap-2">
                      <span className="inline-flex items-center justify-center h-4 w-4 rounded-full bg-brand-50 text-brand-600 text-[10px] font-semibold border border-brand-100">
                        {selectedClients.length}
                      </span>
                      selected
                    </div>
                  </div>
                )}
             </div>
          </div>
          
          <div className="flex items-center gap-4">
             <div className="relative">
                <Icons.Bell size={18} className="text-slate-400 hover:text-slate-600 cursor-pointer transition-colors" />
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-rose-500 rounded-full border border-white"></span>
             </div>
             <div className="h-4 w-px bg-slate-200"></div>
             <div className="flex items-center gap-2 cursor-pointer hover:bg-white px-2 py-1 rounded-md transition-colors border border-slate-200 bg-white">
               <Icons.Calendar size={14} className="text-slate-400" />
               <select
                 value={dateRangeKey}
                 onChange={(e) => {
                   const key = e.target.value as '7d' | '30d' | '12m' | 'all';
                   setDateRangeKey(key);
                   setDateRange(buildRange(key));
                 }}
                 className="text-sm font-medium text-slate-600 bg-transparent focus:outline-none"
               >
                 <option value="7d">Last 7 Days</option>
                 <option value="30d">Last 30 Days</option>
                 <option value="12m">Last 12 Months</option>
                 <option value="all">All Time</option>
               </select>
             </div>
          </div>
        </header>

        <div className="p-4 md:p-8 max-w-7xl mx-auto pb-20">
          <div className="flex flex-wrap items-center gap-2 mb-4 text-xs text-slate-500">
            <span className="uppercase tracking-wide text-[10px] text-slate-400 font-semibold">Selected Clients</span>
            {selectedClientNames.map((name) => (
              <span
                key={name}
                className="px-2 py-1 bg-white border border-slate-200 rounded-full text-slate-600 shadow-sm"
              >
                {name}
              </span>
            ))}
          </div>
          {renderView()}
        </div>
      </main>
    </div>
  );
};