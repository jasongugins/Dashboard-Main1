import React, { useState } from 'react';
import { Card } from '../ui/Card';
import { Icons } from '../ui/Icons';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

const timelineData = [
  { time: '00:00', fine: 120, coarse: 30, organic: 45 },
  { time: '04:00', fine: 80, coarse: 15, organic: 30 },
  { time: '08:00', fine: 250, coarse: 90, organic: 120 },
  { time: '12:00', fine: 400, coarse: 150, organic: 180 },
  { time: '16:00', fine: 380, coarse: 140, organic: 160 },
  { time: '20:00', fine: 300, coarse: 110, organic: 140 },
  { time: '23:59', fine: 150, coarse: 50, organic: 60 },
];

const schemaData = [
  { event: 'Purchase > $200', value: 63, type: 'Fine', status: 'Active', tier: 3 },
  { event: 'Purchase < $50', value: 40, type: 'Fine', status: 'Active', tier: 3 },
  { event: 'Add to Cart', value: 'High', type: 'Coarse', status: 'Warning', tier: 2 },
  { event: 'View Content', value: 'Low', type: 'Coarse', status: 'Active', tier: 1 },
];

// Setup Wizard Component
const AAKWizard: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [step, setStep] = useState(1);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  const handleCopyCode = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyUrl = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const aasaCode = `{
  "applinks": {
    "apps": [],
    "details": [
      {
        "appID": "TeamID.com.client.app",
        "paths": [ "/products/*", "/checkout/*" ]
      }
    ]
  },
  "webcredentials": {
    "apps": [ "TeamID.com.client.app" ]
  }
}`;

  const listenerUrl = "https://api.velocity.intel/v1/postbacks/aak/listener";

  const steps = [
    { id: 1, title: 'Site Association', description: 'Domain Verification' },
    { id: 2, title: 'Conversion Schema', description: 'Event Mapping' },
    { id: 3, title: 'Endpoint Verify', description: 'Connection Test' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl border border-slate-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 rounded-t-2xl">
          <div>
            <h3 className="text-lg font-bold text-slate-900">AdAttributionKit Setup</h3>
            <p className="text-xs text-slate-500 mt-1">Configure iOS 18 attribution for [Client Name]</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-200 transition-colors">
            <Icons.Close size={20} />
          </button>
        </div>

        {/* Stepper */}
        <div className="px-8 py-6 bg-white border-b border-slate-100">
          <div className="flex items-center justify-between relative">
            {/* Connecting Line */}
            <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-full h-0.5 bg-slate-100 -z-10" />
            
            {steps.map((s, index) => {
              const isActive = step === s.id;
              const isCompleted = step > s.id;
              
              return (
                <div key={s.id} className="flex flex-col items-center bg-white px-2">
                  <div 
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 border-2 ${
                      isActive 
                        ? 'bg-brand-600 text-white border-brand-600 shadow-lg shadow-brand-500/30 scale-110' 
                        : isCompleted 
                          ? 'bg-emerald-500 text-white border-emerald-500' 
                          : 'bg-white text-slate-300 border-slate-200'
                    }`}
                  >
                    {isCompleted ? <Icons.CheckCircle size={16} /> : s.id}
                  </div>
                  <div className={`mt-2 text-center transition-colors duration-300 ${isActive ? 'text-brand-600' : 'text-slate-400'}`}>
                    <p className="text-xs font-bold">{s.title}</p>
                    <p className="text-[10px] hidden sm:block">{s.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="p-8 overflow-y-auto flex-1 bg-[#fafafa]">
          {step === 1 && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex gap-4 items-start">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-xl h-fit shadow-sm border border-blue-100">
                  <Icons.Link size={24} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Step 1: Host Association File</h4>
                  <p className="text-sm text-slate-500 mt-1 leading-relaxed text-balance">
                    iOS requires a JSON file hosted on the client's domain to verify App ownership. Create a file named <code className="bg-slate-200 px-1 py-0.5 rounded text-slate-700 font-mono text-xs">apple-app-site-association</code> (no extension).
                  </p>
                </div>
              </div>

              <div className="relative group rounded-xl overflow-hidden border border-slate-200 shadow-sm bg-slate-900">
                <div className="flex justify-between items-center px-4 py-2 bg-slate-800 border-b border-slate-700">
                  <span className="text-xs text-slate-400 font-mono">.well-known/apple-app-site-association</span>
                  <button 
                    onClick={() => handleCopyCode(aasaCode)}
                    className="flex items-center gap-1.5 px-2 py-1 bg-slate-700 hover:bg-slate-600 text-slate-300 text-[10px] font-medium rounded transition-colors"
                  >
                    {copiedCode ? <Icons.CheckCircle size={12} className="text-emerald-400" /> : <Icons.Copy size={12} />}
                    {copiedCode ? 'Copied!' : 'Copy JSON'}
                  </button>
                </div>
                <pre className="p-4 text-slate-50 text-[11px] font-mono overflow-x-auto leading-relaxed">
                  {aasaCode}
                </pre>
              </div>

              <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl flex gap-3 shadow-sm">
                 <Icons.AlertTriangle className="text-amber-500 flex-shrink-0" size={18} />
                 <p className="text-xs text-amber-800 leading-relaxed">
                   <strong>Requirement:</strong> The file must be served with <code className="bg-amber-100/50 px-1 rounded">Content-Type: application/json</code> and accessible via HTTPS without redirects.
                 </p>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-fade-in">
               <div className="flex gap-4 items-start">
                <div className="p-3 bg-purple-50 text-purple-600 rounded-xl h-fit shadow-sm border border-purple-100">
                  <Icons.Settings size={24} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Step 2: Conversion Schema</h4>
                  <p className="text-sm text-slate-500 mt-1 leading-relaxed text-balance">
                    Map your "Fine" (0-63) and "Coarse" (High/Med/Low) conversion values. We automatically decode these postbacks.
                  </p>
                </div>
              </div>

              <div className="space-y-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Fine Values (Priority)</span>
                  <span className="text-xs text-slate-400">0-63</span>
                </div>
                
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm shadow-sm border border-emerald-200">63</div>
                   <div className="flex-1">
                     <label className="text-[10px] uppercase font-bold text-slate-500">Highest Value Event</label>
                     <input type="text" defaultValue="Purchase > $200" className="w-full text-sm font-medium text-slate-900 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none transition-all" />
                   </div>
                </div>

                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-sm shadow-sm border border-emerald-100">62</div>
                   <div className="flex-1">
                     <label className="text-[10px] uppercase font-bold text-slate-500">Second Priority</label>
                     <input type="text" defaultValue="Purchase > $150" className="w-full text-sm font-medium text-slate-900 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none transition-all" />
                   </div>
                </div>

                <div className="flex items-center justify-center py-2">
                   <span className="text-xs text-slate-400 italic bg-slate-50 px-3 py-1 rounded-full">... 58 values configured ...</span>
                </div>

                <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2 mt-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Coarse Values (Fallback)</span>
                  <span className="text-xs text-slate-400">H / M / L</span>
                </div>

                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-sm shadow-sm border border-purple-200">HI</div>
                   <div className="flex-1">
                     <label className="text-[10px] uppercase font-bold text-slate-500">High Signal</label>
                     <input type="text" defaultValue="Add to Cart" className="w-full text-sm font-medium text-slate-900 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none transition-all" />
                   </div>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex flex-col items-center text-center pt-4 pb-2">
                 <div className="relative mb-6">
                   <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center border border-emerald-100 shadow-sm">
                     <Icons.Server size={32} />
                   </div>
                   <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-emerald-500 rounded-full border-4 border-white flex items-center justify-center shadow-md">
                     <Icons.CheckCircle size={14} className="text-white" />
                   </div>
                 </div>
                 <h4 className="text-xl font-bold text-slate-900">Listener Ready</h4>
                 <p className="text-sm text-slate-500 mt-2 max-w-sm mx-auto">
                   Your server-side endpoint is active and listening. Configure your MMP or App to send postbacks here.
                 </p>
              </div>

              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Postback Endpoint URL</label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-600 font-mono truncate">
                    {listenerUrl}
                  </div>
                  <button 
                    onClick={() => handleCopyUrl(listenerUrl)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-sm border ${
                      copiedUrl 
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {copiedUrl ? <Icons.CheckCircle size={16} /> : <Icons.Copy size={16} />}
                    {copiedUrl ? 'Copied' : 'Copy'}
                  </button>
                </div>
              </div>

              <div className="w-full p-4 border border-dashed border-slate-300 rounded-xl bg-slate-50/50 flex flex-col items-center justify-center text-slate-400 min-h-[100px]">
                 <div className="flex items-center gap-3">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-brand-500"></span>
                    </span>
                   <span className="text-sm font-medium text-slate-500">Waiting for first test event...</span>
                 </div>
                 <p className="text-xs text-slate-400 mt-2">Send a test postback from Xcode to verify.</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 bg-white rounded-b-2xl flex justify-between z-10">
           <button 
             onClick={() => step > 1 ? setStep(step - 1) : onClose()}
             className="px-5 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors"
           >
             {step === 1 ? 'Cancel' : 'Back'}
           </button>
           <button 
             onClick={() => step < 3 ? setStep(step + 1) : onClose()}
             className="px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium rounded-lg shadow-lg shadow-brand-500/20 transition-all flex items-center gap-2 transform active:scale-95"
           >
             {step === 3 ? 'Finish Setup' : 'Continue'}
             {step < 3 && <Icons.ArrowDown size={16} className="-rotate-90" />}
           </button>
        </div>
      </div>
    </div>
  );
};

export const Attribution: React.FC = () => {
  const [cooldownDays, setCooldownDays] = useState(7);
  const [showWizard, setShowWizard] = useState(false);
  
  // Simulate cannibalization savings based on slider
  const savings = Math.round(cooldownDays * 142.5); 

  return (
    <div className="space-y-6 animate-fade-in pb-12 relative">
      {showWizard && <AAKWizard onClose={() => setShowWizard(false)} />}

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-2">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">AdAttributionKit Intelligence</h1>
          <p className="text-slate-500 text-sm mt-1">iOS 18 Postback Decoding & Crowd Anonymity Management.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowWizard(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white text-slate-700 rounded-lg border border-slate-200 text-sm font-medium hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm group"
          >
            <Icons.Settings size={16} className="text-slate-400 group-hover:text-slate-600 transition-colors" />
            Configure Setup
          </button>
          <div className="flex items-center gap-2 px-3 py-2 bg-indigo-50 text-indigo-700 rounded-lg border border-indigo-100 text-sm font-medium">
            <Icons.Activity size={16} />
            <span>Postback Loop: <span className="font-bold">Active (48h)</span></span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Chart Column */}
        <div className="lg:col-span-2 space-y-6">
          <Card title="Signal Fidelity Timeline" subtitle="Fine (Tier 3) vs. Coarse (Tier 1/2) Conversion Data">
            <div className="h-[320px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timelineData}>
                  <defs>
                    <linearGradient id="colorFine" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorCoarse" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                  <Tooltip 
                     contentStyle={{
                       backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                       borderRadius: '12px', 
                       border: '1px solid #e2e8f0',
                       boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                     }}
                  />
                  <Legend iconType="circle" />
                  <Area type="monotone" dataKey="fine" name="Fine Values (0-63)" stroke="#0ea5e9" fillOpacity={1} fill="url(#colorFine)" strokeWidth={2} />
                  <Area type="monotone" dataKey="coarse" name="Coarse Values (L/M/H)" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorCoarse)" strokeWidth={2} />
                  <Area type="monotone" dataKey="organic" name="Organic Baseline" stroke="#cbd5e1" fill="transparent" strokeDasharray="5 5" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
          
          {/* Conversion Schema Matrix */}
          <Card title="Conversion Schema Mapping" subtitle="Current Event-to-Value Configuration">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-400 uppercase bg-slate-50/50">
                  <tr>
                    <th className="px-4 py-3 font-medium rounded-l-lg">Event Name</th>
                    <th className="px-4 py-3 font-medium">Schema Value</th>
                    <th className="px-4 py-3 font-medium">Granularity</th>
                    <th className="px-4 py-3 font-medium text-right rounded-r-lg">Current Tier</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {schemaData.map((row, i) => (
                    <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3 font-medium text-slate-700">{row.event}</td>
                      <td className="px-4 py-3">
                        <span className={`font-mono text-xs px-2 py-1 rounded border ${
                          typeof row.value === 'number' 
                            ? 'bg-blue-50 text-blue-700 border-blue-100' 
                            : 'bg-purple-50 text-purple-700 border-purple-100'
                        }`}>
                          {row.value}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500">{row.type}</td>
                      <td className="px-4 py-3 text-right">
                         <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                           row.tier === 3 ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                           row.tier === 2 ? 'bg-amber-50 text-amber-700 border-amber-100' :
                           'bg-slate-100 text-slate-600 border-slate-200'
                         }`}>
                           {row.tier === 3 && <Icons.CheckCircle size={10} />}
                           Tier {row.tier}
                         </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Sidebar Column */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Crowd Anonymity Monitor */}
          <Card title="Crowd Anonymity Monitor" className="relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Icons.Target size={60} className="text-brand-500" />
            </div>
            
            <div className="mt-2 space-y-6">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-500">Daily Conversion Volume</span>
                  <span className="font-bold text-slate-900">842 <span className="text-slate-400 font-normal">/ 1000</span></span>
                </div>
                {/* Progress Bar */}
                <div className="h-3 bg-slate-100 rounded-full overflow-hidden flex">
                  <div className="w-[30%] bg-slate-300 border-r border-white" title="Tier 1"></div>
                  <div className="w-[50%] bg-brand-300 border-r border-white" title="Tier 2"></div>
                  <div className="w-[4.2%] bg-brand-500" title="Current Progress"></div>
                </div>
                <div className="flex justify-between text-[10px] text-slate-400 mt-1 uppercase tracking-wider font-medium">
                  <span>Tier 1</span>
                  <span>Tier 2</span>
                  <span>Tier 3</span>
                </div>
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-100 flex gap-3">
                <Icons.AlertTriangle className="text-amber-500 flex-shrink-0" size={18} />
                <div className="space-y-1">
                  <p className="text-xs font-bold text-amber-800">Tier 3 Data Locked</p>
                  <p className="text-[11px] text-amber-700 leading-tight">
                    You are 158 conversions away from unlocking granular "Fine" values. Aggregated "Coarse" values currently active.
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Cooldown Simulator */}
          <Card title="Re-engagement Cooldown" subtitle="Prevent Organic Cannibalization">
             <div className="mt-4 space-y-6">
               <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-semibold uppercase text-slate-400">Lookback Window</label>
                    <span className="text-sm font-bold text-brand-600 bg-brand-50 px-2 py-0.5 rounded border border-brand-100">{cooldownDays} Days</span>
                  </div>
                  <input 
                    type="range" 
                    min="1" 
                    max="30" 
                    value={cooldownDays} 
                    onChange={(e) => setCooldownDays(parseInt(e.target.value))}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-brand-500"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>1 Day</span>
                    <span>14 Days</span>
                    <span>30 Days</span>
                  </div>
               </div>

               <div className="pt-4 border-t border-slate-100">
                 <div className="flex items-center justify-between mb-2">
                   <span className="text-sm text-slate-600">Est. Wasted Spend Saved</span>
                   <span className="text-emerald-600 font-bold">~${savings}</span>
                 </div>
                 <p className="text-[11px] text-slate-400 italic">
                   Based on blocking re-engagement ads for users who converted organically within the selected window.
                 </p>
               </div>
               
               <button className="w-full py-2 bg-slate-900 text-white text-xs font-medium rounded-lg hover:bg-slate-800 transition-colors shadow-lg shadow-slate-200">
                 Apply Configuration
               </button>
             </div>
          </Card>

          {/* Universal Link Status */}
          <Card>
             <div className="flex items-center justify-between">
               <div className="flex items-center gap-3">
                 <div className="p-2 bg-emerald-50 rounded-lg">
                   <Icons.Link size={18} className="text-emerald-600" />
                 </div>
                 <div>
                   <h4 className="text-sm font-semibold text-slate-800">Universal Links</h4>
                   <p className="text-xs text-slate-500">apple-app-site-association</p>
                 </div>
               </div>
               <div className="flex flex-col items-end">
                 <span className="flex items-center gap-1 text-xs font-bold text-emerald-600">
                   <Icons.CheckCircle size={12} /> Validated
                 </span>
                 <span className="text-[10px] text-slate-400">Checked 2m ago</span>
               </div>
             </div>
          </Card>

        </div>
      </div>
    </div>
  );
};