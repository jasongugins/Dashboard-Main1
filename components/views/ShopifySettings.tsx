import React, { useState } from 'react';
import { Card } from '../ui/Card';
import { Icons } from '../ui/Icons';
import { useShopify } from '../../hooks/useShopify';

interface ShopifySettingsProps {
  clientId: string;
  clientName?: string;
}

export const ShopifySettings: React.FC<ShopifySettingsProps> = ({ clientId, clientName }) => {
  const [showToken, setShowToken] = useState(false);
  const { form, state, isConnecting, isConnected, isSyncing, isSaving, updateForm, testConnection, syncNow, saveCredentials } = useShopify({ clientId });

  const onTest = async () => {
    await testConnection({
      storeDomain: form.storeDomain,
      accessToken: form.accessToken,
      apiVersion: form.apiVersion,
    });
  };

  const onSave = async () => {
    return saveCredentials({
      storeDomain: form.storeDomain,
      accessToken: form.accessToken,
      apiVersion: form.apiVersion,
    });
  };

  const onSync = async () => {
    await syncNow();
  };

  return (
    <Card
      title="Shopify Plus"
      subtitle="Connect your store to sync orders, products (COGS), payouts, markets, and B2B metafields"
      action={<span className="text-[11px] text-slate-400">Client: {clientName || clientId}</span>}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Store Domain</label>
            <input
              type="text"
              value={form.storeDomain}
              onChange={(e) => updateForm('storeDomain', e.target.value)}
              placeholder="your-store.myshopify.com"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Access Token</label>
            <div className="relative">
              <input
                type={showToken ? 'text' : 'password'}
                value={form.accessToken}
                onChange={(e) => updateForm('accessToken', e.target.value)}
                placeholder="shpat_..."
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all pr-10"
              />
              <button
                type="button"
                onClick={() => setShowToken((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showToken ? <Icons.EyeOff size={14} /> : <Icons.Eye size={14} />}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">API Version</label>
              <input
                type="text"
                value={form.apiVersion}
                onChange={(e) => updateForm('apiVersion', e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all"
              />
            </div>

            <div className="flex items-end gap-2">
              <button
                onClick={onTest}
                disabled={isConnecting}
                className="flex-1 px-3 py-2 bg-slate-100 hover:bg-slate-200 disabled:bg-slate-300 disabled:cursor-not-allowed text-slate-700 text-sm font-medium rounded-lg transition-colors shadow-sm"
              >
                {isConnecting ? 'Testing...' : 'Test Connection'}
              </button>
              <button
                onClick={onSave}
                disabled={isSaving}
                className="px-3 py-2 bg-brand-600 border border-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700 disabled:bg-slate-300 disabled:text-white transition-colors shadow-sm"
              >
                {isSaving ? 'Connecting...' : 'Connect Store'}
              </button>
              <button
                onClick={onSync}
                disabled={!isConnected || isSyncing}
                className="px-3 py-2 bg-white border border-slate-200 text-slate-600 text-sm font-medium rounded-lg hover:bg-slate-50 disabled:bg-slate-100 disabled:text-slate-400 transition-colors"
              >
                {isSyncing ? 'Syncing...' : 'Sync Data'}
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-3 bg-slate-50 rounded-xl p-4 border border-slate-100">
          <div className="flex items-center gap-2 text-sm">
            <StatusBadge status={state.status} />
            {state.shopName && <span className="font-semibold text-slate-700">{state.shopName}</span>}
            {state.domain && <span className="text-slate-400 text-xs">{state.domain}</span>}
          </div>

          {state.error && (
            <div className="text-xs text-rose-600 bg-rose-50 border border-rose-100 rounded-lg p-2">
              {state.error}
            </div>
          )}

          {state.status === 'connected' && state.shopName && (
            <div className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg p-2">
              Connected to {state.shopName}!
            </div>
          )}

          <div className="text-xs text-slate-600 space-y-1">
            <div className="flex items-center gap-2">
              <Icons.CheckCircle size={14} className="text-emerald-500" />
              Orders with line items, discounts, shipping
            </div>
            <div className="flex items-center gap-2">
              <Icons.CheckCircle size={14} className="text-emerald-500" />
              Products + variants (inventory_cost for COGS)
            </div>
            <div className="flex items-center gap-2">
              <Icons.CheckCircle size={14} className="text-emerald-500" />
              Payouts / transactions (fees)
            </div>
            <div className="flex items-center gap-2">
              <Icons.CheckCircle size={14} className="text-emerald-500" />
              Plus: markets and B2B company metafields
            </div>
          </div>

          <div className="text-[11px] text-slate-400 mt-2">
            Manual sync only (Phase 1). Background jobs coming later.
          </div>

          {state.lastSync && (
            <div className="text-[11px] text-slate-500">Last sync: {state.lastSync.toLocaleString()}</div>
          )}
        </div>
      </div>
    </Card>
  );
};

const StatusBadge: React.FC<{ status: 'disconnected' | 'connecting' | 'connected' | 'error' }> = ({ status }) => {
  const styles: Record<typeof status, { text: string; className: string }> = {
    disconnected: { text: 'Disconnected', className: 'bg-slate-100 text-slate-600 border-slate-200' },
    connecting: { text: 'Connecting', className: 'bg-amber-50 text-amber-700 border-amber-100' },
    connected: { text: 'Connected', className: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
    error: { text: 'Error', className: 'bg-rose-50 text-rose-700 border-rose-100' },
  }[status];

  return (
    <span className={`px-2 py-1 rounded-full text-[11px] font-semibold border ${styles.className}`}>
      {styles.text}
    </span>
  );
};
