import React, { useMemo } from 'react';
import { Card } from '../ui/Card';
import { Icons } from '../ui/Icons';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { useDashboardMetrics } from '../../hooks/useDashboardMetrics';

const currency = (v: number) => `$${(v || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
const numberFmt = (v: number) => (v || 0).toLocaleString();
const dateRangeDays = 30;

const useSalesData = (sales: { date: string; revenue: number; orders: number }[]) =>
  sales.map((s) => ({ name: s.date.slice(5), revenue: s.revenue, orders: s.orders }));

interface OverviewProps {
  clientId: string;
  dateRange: { startDate: string; endDate: string; label?: string };
}

const attributionData = [
  { name: 'Meta (Pixel)', value: 85, color: '#94a3b8' },
  { name: 'Server-Side (Truth)', value: 120, color: '#0ea5e9' },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/90 backdrop-blur-md p-3 border border-slate-100 shadow-xl rounded-lg text-xs">
        <p className="font-semibold text-slate-700 mb-1">{label}</p>
        <p className="text-slate-400 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-slate-300"></span>
          Revenue: <span className="text-slate-600 font-mono">{currency(payload[0].value)}</span>
        </p>
        <p className="text-brand-500 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-brand-500"></span>
          Orders: <span className="font-bold font-mono">{payload[1].value}</span>
        </p>
      </div>
    );
  }
  return null;
};

const StrategicCard = ({ title, competitor, reality, us, icon: Icon, colorClass }: any) => (
  <div className="p-5 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
    <div className="flex items-center gap-3 mb-4">
      <div className={`p-2 rounded-lg ${colorClass} bg-opacity-10 text-opacity-100`}>
        <Icon size={20} className={colorClass.replace('bg-', 'text-')} />
      </div>
      <h3 className="font-semibold text-slate-800 text-sm">{title}</h3>
    </div>
    
    <div className="space-y-3">
      <div className="pl-3 border-l-2 border-slate-200">
        <p className="text-[10px] uppercase font-bold text-slate-400">Competitor Position</p>
        <p className="text-xs text-slate-500 mt-0.5">"{competitor}"</p>
      </div>
      <div className="pl-3 border-l-2 border-rose-200">
        <p className="text-[10px] uppercase font-bold text-rose-400">Reality</p>
        <p className="text-xs text-slate-500 mt-0.5">{reality}</p>
      </div>
      <div className="pl-3 border-l-2 border-brand-500 bg-brand-50/50 py-1 pr-1 -ml-1 rounded-r-md">
        <p className="text-[10px] uppercase font-bold text-brand-600 ml-1">Our Position</p>
        <p className="text-xs font-medium text-brand-700 mt-0.5 ml-1">"{us}"</p>
      </div>
    </div>
  </div>
);

export const Overview: React.FC<OverviewProps> = ({ clientId, dateRange }) => {
  const { metrics, sales, loading, error } = useDashboardMetrics(clientId, dateRange.startDate, dateRange.endDate);
  const chartData = useMemo(() => useSalesData(sales || []), [sales]);

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Executive Strategic Overview</h1>
          <p className="text-slate-500 text-sm mt-1">Real-time pulse on Sales Velocity, Attribution, and Compliance.</p>
        </div>
        <div className="flex gap-2">
           <button className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 transition-colors shadow-sm flex items-center gap-2">
             <Icons.Trigger size={16} className="text-accent-rose" />
             Trigger Events: 3 Active
           </button>
           <button className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors shadow-lg shadow-brand-500/20">
             Generate Report
           </button>
        </div>
      </div>

      {error && (
        <div className="text-xs text-rose-600 bg-rose-50 border border-rose-100 rounded-lg p-2">
          {error}
        </div>
      )}

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <Card gradientBorder className="bg-gradient-to-br from-white to-brand-50/30 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start">
              <div className="p-2 bg-brand-50 rounded-lg">
                <Icons.Profitability size={20} className="text-brand-600" />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-slate-400 text-xs font-medium uppercase tracking-wider">Total Revenue</span>
              <h2 className="text-3xl font-bold text-slate-900 mt-1">{loading ? '—' : currency(metrics?.totalRevenue || 0)}</h2>
              <p className="text-xs text-slate-500 mt-1">{dateRange.label || 'Last 30 Days'}</p>
            </div>
          </div>
          <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
            <button className="text-[10px] font-medium text-slate-400 hover:text-brand-600 transition-colors">
              View Details
            </button>
            <button className="text-[10px] font-medium text-brand-600 hover:text-brand-700 transition-colors flex items-center gap-1">
              <Icons.Target size={12} />
              Export
            </button>
          </div>
        </Card>

        {/* Orders */}
        <Card className="flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start">
               <div className="p-2 bg-purple-50 rounded-lg">
                <Icons.Attribution size={20} className="text-purple-600" />
              </div>
            </div>
             <div className="mt-4">
              <span className="text-slate-400 text-xs font-medium uppercase tracking-wider">Orders</span>
              <h2 className="text-3xl font-bold text-slate-900 mt-1">{loading ? '—' : numberFmt(metrics?.totalOrders || 0)}</h2>
              <p className="text-xs text-slate-500 mt-1">{dateRange.label || 'Last 30 Days'}</p>
            </div>
          </div>
          <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
            <button className="text-[10px] font-medium text-slate-400 hover:text-purple-600 transition-colors">
              View Details
            </button>
            <button className="text-[10px] font-medium text-purple-600 hover:text-purple-700 transition-colors flex items-center gap-1">
              <Icons.Settings size={12} />
              Configure
            </button>
          </div>
        </Card>

        {/* AOV */}
        <Card className="flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start">
              <div className="p-2 bg-amber-50 rounded-lg">
                <Icons.Compliance size={20} className="text-amber-600" />
              </div>
            </div>
             <div className="mt-4">
              <span className="text-slate-400 text-xs font-medium uppercase tracking-wider">Average Order Value</span>
              <h2 className="text-3xl font-bold text-slate-900 mt-1">{loading ? '—' : currency(metrics?.averageOrderValue || 0)}</h2>
              <p className="text-xs text-slate-500 mt-1">Revenue per order</p>
            </div>
          </div>
          <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
            <button className="text-[10px] font-medium text-slate-400 hover:text-amber-600 transition-colors">
              View Details
            </button>
            <button className="text-[10px] font-medium text-amber-600 hover:text-amber-700 transition-colors flex items-center gap-1">
              <Icons.ShieldCheck size={12} />
              Benchmarks
            </button>
          </div>
        </Card>

        {/* Products */}
        <Card className="flex flex-col justify-between">
           <div>
             <div className="flex justify-between items-start">
              <div className="p-2 bg-cyan-50 rounded-lg">
                <Icons.Activity size={20} className="text-cyan-600" />
              </div>
            </div>
             <div className="mt-4">
              <span className="text-slate-400 text-xs font-medium uppercase tracking-wider">Total Products</span>
              <h2 className="text-3xl font-bold text-slate-900 mt-1">{loading ? '—' : numberFmt(metrics?.totalProducts || 0)}</h2>
              <p className="text-xs text-slate-500 mt-1">Catalog size</p>
            </div>
          </div>
          <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
            <button className="text-[10px] font-medium text-slate-400 hover:text-cyan-600 transition-colors">
              View Details
            </button>
            <button className="text-[10px] font-medium text-cyan-600 hover:text-cyan-700 transition-colors flex items-center gap-1">
              <Icons.BarChart2 size={12} />
              Forecast
            </button>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <div className="lg:col-span-2">
          <Card title="Sales Performance" subtitle="Revenue and Orders (daily)" className="h-[400px]">
             <ResponsiveContainer width="100%" height="100%">
               <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRoas" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#cbd5e1" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#cbd5e1" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorPoas" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="revenue" stroke="#cbd5e1" fillOpacity={1} fill="url(#colorRoas)" strokeWidth={2} strokeDasharray="5 5" />
                  <Area type="monotone" dataKey="orders" stroke="#0ea5e9" fillOpacity={1} fill="url(#colorPoas)" strokeWidth={3} />
                </AreaChart>
             </ResponsiveContainer>
          </Card>
        </div>

        {/* Side Widget */}
        <div className="lg:col-span-1 space-y-6">
          <Card title="Attribution Gap" subtitle="iOS 18 Signal Loss Impact" className="h-[400px]">
            <div className="flex flex-col h-full justify-between pb-8">
               <ResponsiveContainer width="100%" height={200}>
                 <BarChart data={attributionData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 11}} dy={10}/>
                    <Tooltip 
                      cursor={{fill: 'transparent'}}
                      contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                    />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {attributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                 </BarChart>
               </ResponsiveContainer>
               
               <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                  <div className="flex items-start gap-3">
                    <Icons.Alert size={18} className="text-amber-500 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-semibold text-slate-800">Cannibalization Risk</h4>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                        Retargeting ads are claiming <span className="font-semibold text-slate-700">35%</span> of organic re-engagement. 
                        Enable AdAttributionKit cooldowns to fix.
                      </p>
                    </div>
                  </div>
               </div>
            </div>
          </Card>
        </div>
      </div>
      
      {/* Strategic Positioning Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
        <StrategicCard 
           title="iOS 18 Attribution Crisis"
           competitor="We provide attribution insights"
           reality="Still using client-side pixels, no AdAttributionKit"
           us="The only dashboard with iOS 18-ready server-side attribution"
           icon={Icons.Attribution}
           colorClass="bg-purple-500"
        />
        <StrategicCard 
           title="CIPA Compliance Crisis"
           competitor="We handle data privacy"
           reality="Standard pixels create wiretapping legal liability"
           us="Server-side tracking eliminates CIPA wiretapping risk"
           icon={Icons.Compliance}
           colorClass="bg-amber-500"
        />
        <StrategicCard 
           title="POAS Profitability Crisis"
           competitor="Track your ROAS performance"
           reality="Revenue-only metrics hide unprofitable campaigns"
           us="Real-time POAS calculation with COGS integration"
           icon={Icons.Profitability}
           colorClass="bg-brand-500"
        />
        <StrategicCard 
           title="Complexity Cliff Automation"
           competitor="Multi-client reporting available"
           reality="Manual setup, limited automation, high overhead"
           us="Virtual analyst that eliminates 125h/mo of manual work"
           icon={Icons.Activity}
           colorClass="bg-cyan-500"
        />
      </div>
    </div>
  );
};