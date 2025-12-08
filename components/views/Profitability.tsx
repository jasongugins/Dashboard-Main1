import React from 'react';
import { Card } from '../ui/Card';
import { Icons } from '../ui/Icons';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, ReferenceLine, CartesianGrid } from 'recharts';

const profitData = [
  { name: 'Campaign A', revenue: 4000, cost: 2400, profit: 1600 },
  { name: 'Campaign B', revenue: 3000, cost: 2800, profit: 200 },
  { name: 'Campaign C', revenue: 2000, cost: 2200, profit: -200 },
  { name: 'Campaign D', revenue: 5500, cost: 3000, profit: 2500 },
];

export const Profitability: React.FC = () => {
  return (
    <div className="space-y-6 pb-12">
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Unit Economics & Profitability</h1>
          <p className="text-slate-500 text-sm mt-1">Real-time POAS calculation integrating Stripe fees, COGS, and Ad Spend.</p>
        </div>
        <div className="text-left md:text-right bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
           <span className="text-xs text-slate-400 font-medium uppercase tracking-wider block mb-1">Current Margin</span>
           <div className="flex items-center gap-2">
             <span className="text-3xl font-bold text-slate-900">22.4%</span>
             <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">+1.2%</span>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        <div className="lg:col-span-1 space-y-6">
           {/* Added bg-slate-900 fallback to ensure it's never transparent/black-on-black if gradient fails */}
           <Card className="bg-slate-900 bg-gradient-to-br from-slate-900 to-brand-900 text-white border-slate-800 shadow-xl">
             <div className="p-2">
               <div className="flex items-center gap-2 mb-4 opacity-80">
                  <Icons.BadgeDollarSign size={16} className="text-emerald-400" />
                  <h3 className="text-slate-300 text-xs uppercase tracking-wider font-semibold">Net Profit</h3>
               </div>
               
               <div className="flex items-baseline gap-2">
                 <span className="text-3xl font-bold text-white tracking-tight">$12,450</span>
               </div>
               
               <div className="mt-6 space-y-3">
                 <div className="flex justify-between text-sm">
                   <span className="text-slate-400">Revenue</span>
                   <span className="font-mono text-slate-200">$84,300</span>
                 </div>
                 <div className="flex justify-between text-sm">
                   <span className="text-slate-400">Ad Spend</span>
                   <span className="font-mono text-rose-300">-$24,100</span>
                 </div>
                 <div className="flex justify-between text-sm">
                   <span className="text-slate-400">COGS</span>
                   <span className="font-mono text-slate-200">-$38,500</span>
                 </div>
                 <div className="flex justify-between text-sm">
                   <span className="text-slate-400">Fees/Ship</span>
                   <span className="font-mono text-slate-200">-$9,250</span>
                 </div>
                 <div className="h-px bg-slate-700/50 my-2"></div>
                 <div className="flex justify-between text-sm font-semibold">
                   <span className="text-emerald-400">Profit</span>
                   <span className="font-mono text-emerald-400">$12,450</span>
                 </div>
               </div>
             </div>
           </Card>

           <Card title="Data Sources">
             <div className="space-y-4 mt-2">
               <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                 <div className="flex items-center gap-3">
                   <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]"></div>
                   <span className="text-sm font-medium text-slate-700">Shopify Plus</span>
                 </div>
                 <span className="text-[10px] uppercase font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">Live</span>
               </div>
               <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                 <div className="flex items-center gap-3">
                   <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]"></div>
                   <span className="text-sm font-medium text-slate-700">Meta Ads</span>
                 </div>
                 <span className="text-[10px] uppercase font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">Live</span>
               </div>
               <div className="flex items-center justify-between p-3 bg-amber-50/50 rounded-lg border border-amber-100">
                 <div className="flex items-center gap-3">
                   <div className="relative">
                      <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                      <div className="absolute inset-0 w-2 h-2 rounded-full bg-amber-500 animate-ping opacity-75"></div>
                   </div>
                   <span className="text-sm font-medium text-slate-700">Google Sheets</span>
                 </div>
                 <span className="text-[10px] uppercase font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">Syncing</span>
               </div>
             </div>
           </Card>
        </div>

        <div className="lg:col-span-3">
          <Card 
            title="Campaign Profitability Analysis" 
            subtitle="Identifying the 'Silent Burn' campaigns via Real-Time Contribution Margin" 
            className="h-full min-h-[500px]"
            style={{ backgroundColor: 'white' }}
          >
             <div className="mt-6 mb-8 h-[400px] w-full rounded-lg">
               <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={profitData} layout="vertical" margin={{ left: 40, right: 20, top: 20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                    <XAxis type="number" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11}} />
                    <YAxis dataKey="name" type="category" width={100} axisLine={false} tickLine={false} tick={{fill: '#475569', fontSize: 13, fontWeight: 500}} />
                    <Tooltip 
                      cursor={{fill: '#f8fafc'}}
                      contentStyle={{borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', backgroundColor: '#ffffff'}}
                    />
                    <ReferenceLine x={0} stroke="#cbd5e1" strokeWidth={2} />
                    <Bar dataKey="profit" barSize={32} radius={[0, 4, 4, 0]}>
                      {profitData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.profit > 0 ? '#10b981' : '#f43f5e'} />
                      ))}
                    </Bar>
                 </BarChart>
               </ResponsiveContainer>
             </div>
             
             <div className="flex items-start gap-3 mt-4 p-4 bg-rose-50 border border-rose-100 rounded-xl relative overflow-hidden">
               <div className="absolute left-0 top-0 bottom-0 w-1 bg-rose-400"></div>
               <Icons.AlertTriangle size={20} className="text-rose-500 mt-0.5 flex-shrink-0" />
               <div>
                  <h4 className="text-sm font-bold text-rose-800">Action Required</h4>
                  <p className="text-sm text-rose-700 mt-1 leading-relaxed">
                    "Campaign C" has a ROAS of 0.9 but is generating <span className="font-bold underline decoration-rose-400/50">negative profit</span> due to high COGS items. Pause recommended immediately to stop the bleed.
                  </p>
               </div>
               <button className="ml-auto text-xs bg-white text-rose-600 px-3 py-1.5 rounded-lg border border-rose-200 font-medium hover:bg-rose-50 transition-colors shadow-sm whitespace-nowrap">
                 Pause Campaign
               </button>
             </div>
          </Card>
        </div>
      </div>
    </div>
  );
};