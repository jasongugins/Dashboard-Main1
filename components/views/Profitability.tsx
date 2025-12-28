import React, { useMemo, useState } from 'react';
import { Card } from '../ui/Card';
import { Icons } from '../ui/Icons';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, ReferenceLine, CartesianGrid } from 'recharts';
import { useProfitability } from '../../hooks/useProfitability';

const currency = (v: number) => `$${(v || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
const percent = (v: number) => `${(v || 0).toFixed(1)}%`;

const sortOptions = [
  { value: 'profit', label: 'Profit' },
  { value: 'marginPct', label: 'Margin %' },
  { value: 'revenue', label: 'Revenue' },
  { value: 'unitsSold', label: 'Units Sold' },
];

interface ProfitabilityProps {
  clientId: string;
  dateRange: { startDate?: string; endDate?: string; label?: string };
}

export const Profitability: React.FC<ProfitabilityProps> = ({ clientId, dateRange }) => {
  const [sortBy, setSortBy] = useState('profit');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const { metrics, skus, loading, error } = useProfitability(clientId, dateRange.startDate, dateRange.endDate, sortBy, sortDir);

  const chartData = useMemo(() => {
    return skus.slice(0, 10).map((sku) => ({ name: sku.name, profit: sku.profit }));
  }, [skus]);

  const toggleSortDir = () => setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));

  return (
    <div className="space-y-6 pb-12">
      <div className="mb-4 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Unit Economics & Profitability</h1>
          <p className="text-slate-500 text-sm mt-1">Real-time profit using synced revenue and COGS.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-600">
            <Icons.Calendar size={14} className="text-slate-400" />
            {dateRange.label || 'Custom'}
          </div>
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-2 py-1">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="text-sm text-slate-700 bg-transparent focus:outline-none"
            >
              {sortOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <button onClick={toggleSortDir} className="text-slate-500 hover:text-slate-800 text-xs px-1">
              {sortDir === 'desc' ? '↓' : '↑'}
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="text-xs text-rose-600 bg-rose-50 border border-rose-100 rounded-lg p-2">{error}</div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="Revenue" icon={<Icons.Activity size={18} className="text-emerald-500" />} value={loading ? '—' : currency(metrics?.revenue || 0)} />
        <MetricCard title="Cost" icon={<Icons.Database size={18} className="text-rose-500" />} value={loading ? '—' : currency(metrics?.cost || 0)} />
        <MetricCard title="Profit" icon={<Icons.BadgeDollarSign size={18} className="text-cyan-500" />} value={loading ? '—' : currency(metrics?.profit || 0)} />
        <MetricCard title="Margin" icon={<Icons.Percent size={18} className="text-purple-500" />} value={loading ? '—' : percent(metrics?.marginPct || 0)} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        <div className="lg:col-span-1">
          <Card className="bg-slate-900 bg-gradient-to-br from-slate-900 to-brand-900 text-white border-slate-800 shadow-xl">
            <div className="p-2">
              <div className="flex items-center gap-2 mb-4 opacity-80">
                <Icons.BadgeDollarSign size={16} className="text-emerald-400" />
                <h3 className="text-slate-300 text-xs uppercase tracking-wider font-semibold">Net Profit</h3>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-white tracking-tight">{loading ? '—' : currency(metrics?.profit || 0)}</span>
              </div>
              <div className="mt-6 space-y-3 text-sm">
                <Row label="Revenue" value={loading ? '—' : currency(metrics?.revenue || 0)} />
                <Row label="COGS" value={loading ? '—' : currency(metrics?.cost || 0)} />
                <div className="h-px bg-slate-700/50 my-2"></div>
                <Row label="Margin" value={loading ? '—' : percent(metrics?.marginPct || 0)} highlight />
              </div>
            </div>
          </Card>
        </div>

        <div className="lg:col-span-3">
          <Card
            title="SKU Performance"
            subtitle="Revenue, cost, and profit by product"
            className="h-full"
          >
            <div className="mt-4 mb-6 h-[320px] w-full rounded-lg">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical" margin={{ left: 40, right: 20, top: 10, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal vertical={false} stroke="#f1f5f9" />
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <YAxis dataKey="name" type="category" width={120} axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 12, fontWeight: 500 }} />
                  <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', backgroundColor: '#ffffff' }} />
                  <ReferenceLine x={0} stroke="#cbd5e1" strokeWidth={2} />
                  <Bar dataKey="profit" barSize={28} radius={[0, 4, 4, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.profit > 0 ? '#10b981' : '#f43f5e'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-500 border-b border-slate-100">
                    <th className="py-2 pr-3">Product</th>
                    <th className="py-2 pr-3">Units</th>
                    <th className="py-2 pr-3">Revenue</th>
                    <th className="py-2 pr-3">Cost</th>
                    <th className="py-2 pr-3">Profit</th>
                    <th className="py-2 pr-3">Margin</th>
                  </tr>
                </thead>
                <tbody>
                  {loading && (
                    <tr><td className="py-3 text-slate-400" colSpan={6}>Loading...</td></tr>
                  )}
                  {!loading && skus.length === 0 && (
                    <tr><td className="py-3 text-slate-400" colSpan={6}>No data in range</td></tr>
                  )}
                  {!loading && skus.map((sku) => (
                    <tr key={sku.productId} className="border-b border-slate-100 last:border-0">
                      <td className="py-2 pr-3 text-slate-800 font-medium">{sku.name}</td>
                      <td className="py-2 pr-3 text-slate-600">{sku.unitsSold}</td>
                      <td className="py-2 pr-3 text-slate-800">{currency(sku.revenue)}</td>
                      <td className="py-2 pr-3 text-slate-600">{currency(sku.cost)}</td>
                      <td className="py-2 pr-3 text-slate-800">{currency(sku.profit)}</td>
                      <td className="py-2 pr-3 text-slate-600">{percent(sku.marginPct)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

const MetricCard = ({ title, icon, value }: { title: string; icon: React.ReactNode; value: string }) => (
  <Card className="flex flex-col justify-between">
    <div>
      <div className="flex justify-between items-start">
        <div className="p-2 bg-slate-50 rounded-lg">{icon}</div>
      </div>
      <div className="mt-4">
        <span className="text-slate-400 text-xs font-medium uppercase tracking-wider">{title}</span>
        <h2 className="text-3xl font-bold text-slate-900 mt-1">{value}</h2>
      </div>
    </div>
  </Card>
);

const Row = ({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) => (
  <div className={`flex justify-between text-sm ${highlight ? 'font-semibold text-emerald-400' : ''}`}>
    <span className="text-slate-300">{label}</span>
    <span className={highlight ? 'font-mono' : 'font-mono text-slate-200'}>{value}</span>
  </div>
);