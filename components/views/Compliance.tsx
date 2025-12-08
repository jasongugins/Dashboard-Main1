import React from 'react';
import { Card } from '../ui/Card';
import { Icons } from '../ui/Icons';
import { ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const data = [
  { name: 'Protected (Server-Side)', value: 92, color: '#0ea5e9' },
  { name: 'Vulnerable (Client-Side)', value: 8, color: '#f43f5e' },
];

export const Compliance: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Legal & Compliance Shield</h1>
        <p className="text-slate-500 text-sm mt-1">Monitoring CIPA liability and FTC "Click-to-Cancel" adherence.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card title="CIPA Liability Exposure" subtitle="Real-time pixel auditing">
          <div className="flex items-center justify-center py-8">
            <div className="relative w-64 h-64">
               <ResponsiveContainer width="100%" height="100%">
                 <PieChart>
                   <Pie
                     data={data}
                     cx="50%"
                     cy="50%"
                     innerRadius={80}
                     outerRadius={100}
                     paddingAngle={5}
                     dataKey="value"
                     startAngle={180}
                     endAngle={0}
                   >
                     {data.map((entry, index) => (
                       <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                     ))}
                   </Pie>
                 </PieChart>
               </ResponsiveContainer>
               <div className="absolute inset-0 flex flex-col items-center justify-center mt-8">
                 <span className="text-4xl font-bold text-slate-800">92%</span>
                 <span className="text-xs text-slate-400 uppercase tracking-wider mt-1">Safe Traffic</span>
               </div>
            </div>
          </div>
          
          <div className="space-y-3 px-4 pb-4">
             <div className="flex items-center justify-between text-sm p-3 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-100">
               <div className="flex items-center gap-2">
                 <Icons.ShieldCheck size={16} />
                 <span>Meta Pixel (CAPI)</span>
               </div>
               <span className="font-semibold">Secured</span>
             </div>
             <div className="flex items-center justify-between text-sm p-3 rounded-lg bg-rose-50 text-rose-800 border border-rose-100">
               <div className="flex items-center gap-2">
                 <Icons.Alert size={16} />
                 <span>Hotjar (Session Replay)</span>
               </div>
               <span className="font-semibold">Blocking</span>
             </div>
          </div>
        </Card>

        <Card title="FTC 'Click-to-Cancel' Monitor" subtitle="Subscription flow analysis">
           <div className="space-y-6 mt-4">
              <div className="relative pl-8 pb-8 border-l border-slate-200 last:pb-0">
                 <div className="absolute left-[-5px] top-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-white"></div>
                 <h4 className="text-sm font-semibold text-slate-800">Homepage Entry</h4>
                 <p className="text-xs text-slate-500 mt-1">User initiates cancellation flow.</p>
              </div>
              <div className="relative pl-8 pb-8 border-l border-slate-200 last:pb-0">
                 <div className="absolute left-[-5px] top-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-white"></div>
                 <h4 className="text-sm font-semibold text-slate-800">One-Click Option</h4>
                 <p className="text-xs text-slate-500 mt-1">"Cancel Subscription" button clearly visible.</p>
              </div>
              <div className="relative pl-8 border-l border-slate-200 last:border-l-0">
                 <div className="absolute left-[-5px] top-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-white"></div>
                 <h4 className="text-sm font-semibold text-slate-800">Confirmation</h4>
                 <p className="text-xs text-slate-500 mt-1">Cancellation processed immediately without dark patterns.</p>
              </div>
              
              <div className="mt-8 p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-3">
                 <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
                   <Icons.ShieldCheck size={20} />
                 </div>
                 <div>
                   <h4 className="text-sm font-semibold text-slate-900">Compliant</h4>
                   <p className="text-xs text-slate-500">Your flow meets new FTC guidelines.</p>
                 </div>
              </div>
           </div>
        </Card>
      </div>
    </div>
  );
};
