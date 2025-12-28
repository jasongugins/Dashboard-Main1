import React, { useState } from 'react';
import { Card } from '../ui/Card';
import { Icons } from '../ui/Icons';
import { ShopifySettings } from './ShopifySettings';

interface SettingsProps {
  clientId?: string;
  clientName?: string;
}

interface IntegrationItem {
  id: string;
  name: string;
  status: 'connected' | 'available' | 'syncing';
  description: string;
  requiresApiKey?: boolean;
}

const validateApiKey = (key: string): string | null => {
  if (!key.trim()) return "Key is required";
  
  // Pattern: sk_live_ followed by alphanumerics OR a UUID
  const skLivePattern = /^sk_live_[a-zA-Z0-9]+$/;
  const uuidPattern = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
  
  if (!skLivePattern.test(key) && !uuidPattern.test(key)) {
     return "Format: 'sk_live_...' or UUID";
  }
  return null;
};

const IntegrationRow: React.FC<{ item: IntegrationItem }> = ({ item }) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState(item.status);
  const [touched, setTouched] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleConnect = () => {
    if (item.requiresApiKey) {
      setIsConnecting(true);
    } else {
      // Simulate direct connection for items without keys
      setConnectionStatus('syncing');
      setTimeout(() => setConnectionStatus('connected'), 1500);
    }
  };

  const handleSaveKey = () => {
    const error = validateApiKey(apiKey);
    if (error) {
        setValidationError(error);
        setTouched(true);
        return;
    }

    setIsConnecting(false);
    setConnectionStatus('syncing');
    // Simulate API verification delay
    setTimeout(() => setConnectionStatus('connected'), 1500);
  };

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-slate-50/50 rounded-xl border border-slate-100 group hover:border-brand-200 transition-colors gap-4">
      <div className="flex items-center gap-3">
        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
          connectionStatus === 'connected' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]' :
          connectionStatus === 'syncing' ? 'bg-amber-500 animate-pulse' :
          'bg-slate-300'
        }`} />
        <div>
          <h4 className="text-sm font-semibold text-slate-800">{item.name}</h4>
          <p className="text-xs text-slate-500">{item.description}</p>
        </div>
      </div>
      
      <div className="flex-shrink-0">
        {connectionStatus === 'connected' && (
          <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-medium rounded-full border border-emerald-100">
            <Icons.CheckCircle size={12} />
            Active
          </span>
        )}
        
        {connectionStatus === 'syncing' && (
          <span className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-700 text-xs font-medium rounded-full border border-amber-100">
            <Icons.Sync size={12} className="animate-spin" />
            Syncing
          </span>
        )}
        
        {connectionStatus === 'available' && !isConnecting && (
          <button 
            onClick={handleConnect}
            className="flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-slate-50 text-slate-600 text-xs font-medium rounded-full border border-slate-200 shadow-sm transition-all"
          >
            <Icons.Plus size={12} />
            Connect
          </button>
        )}

        {isConnecting && (
          <div className="flex items-center gap-2 animate-fade-in items-start">
            <div className="relative">
                <input 
                type={showApiKey ? "text" : "password"}
                placeholder="Enter API Key"
                value={apiKey}
                onChange={(e) => {
                    setApiKey(e.target.value);
                    if (touched) {
                        setValidationError(validateApiKey(e.target.value));
                    }
                }}
                onBlur={() => {
                    setTouched(true);
                    setValidationError(validateApiKey(apiKey));
                }}
                className={`pl-3 pr-8 py-1 text-xs border rounded-lg focus:outline-none focus:ring-1 w-32 md:w-48 bg-white transition-all ${
                    validationError
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                    : 'border-slate-300 focus:border-brand-500 focus:ring-brand-500'
                }`}
                />
                <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-2 top-[5px] text-slate-400 hover:text-slate-600 focus:outline-none"
                >
                    {showApiKey ? <Icons.EyeOff size={12} /> : <Icons.Eye size={12} />}
                </button>
                {validationError && (
                    <span className="absolute -bottom-5 left-0 text-[10px] text-red-500 font-medium whitespace-nowrap animate-fade-in">
                        {validationError}
                    </span>
                )}
            </div>
            
            <button 
              onClick={handleSaveKey}
              className="px-3 py-1 bg-brand-600 hover:bg-brand-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-xs font-medium rounded-lg transition-colors shadow-sm whitespace-nowrap"
            >
              Save Key
            </button>
            <button 
              onClick={() => {
                  setIsConnecting(false);
                  setApiKey('');
                  setTouched(false);
                  setValidationError(null);
              }}
              className="p-1 hover:bg-slate-200 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
            >
              <Icons.Close size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export const Settings: React.FC<SettingsProps> = ({ clientId = '', clientName }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showModalApiKey, setShowModalApiKey] = useState(false);
  
  // Modal Form State
  const [modalForm, setModalForm] = useState({
    name: '',
    category: 'E-commerce Source',
    endpoint: '',
    apiKey: '',
    description: '',
    webhookUrl: '',
    connectionTimeout: 30
  });

  const ecommerceIntegrations: IntegrationItem[] = [
    { id: 'shopify', name: 'Shopify Plus', status: 'connected', description: 'Orders, Customers, Products' },
    { id: 'bigcommerce', name: 'BigCommerce', status: 'available', description: 'Enterprise Integration', requiresApiKey: true },
    { id: 'magento', name: 'Adobe Commerce (Magento)', status: 'available', description: 'Legacy Connector', requiresApiKey: true },
  ];

  const marketingIntegrations: IntegrationItem[] = [
    { id: 'meta', name: 'Meta Ads Manager', status: 'connected', description: 'Facebook & Instagram (CAPI)' },
    { id: 'google', name: 'Google Ads', status: 'connected', description: 'Search, Shopping, YouTube' },
    { id: 'tiktok', name: 'TikTok Ads', status: 'available', description: 'Pixel & Events API', requiresApiKey: true },
    { id: 'klaviyo', name: 'Klaviyo', status: 'connected', description: 'Email & SMS Attribution' },
  ];

  const analyticsIntegrations: IntegrationItem[] = [
    { id: 'ga4', name: 'Google Analytics 4', status: 'connected', description: 'Behavioral Analytics' },
    { id: 'triplewhale', name: 'Triple Whale', status: 'available', description: 'Pixel Data Import', requiresApiKey: true },
    { id: 'northbeam', name: 'Northbeam', status: 'available', description: 'Attribution Modeling', requiresApiKey: true },
  ];

  const financialIntegrations: IntegrationItem[] = [
    { id: 'cogs_sheets', name: 'COGS - Google Sheets', status: 'syncing', description: 'Live sync from "Master_Product_Costing_v2"', requiresApiKey: false },
    { id: 'cogs_erp', name: 'COGS - Enterprise ERP', status: 'available', description: 'NetSuite, SAP, Microsoft Dynamics', requiresApiKey: true },
    { id: 'shipping', name: 'Shipping Costs', status: 'connected', description: 'ShipStation / 3PL Central' },
    { id: 'fees', name: 'Payment Gateway Fees', status: 'connected', description: 'Stripe / Shopify Payments' },
  ];

  const filterIntegrations = (items: IntegrationItem[]) => {
    return items.filter(item => 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      item.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const filteredEcommerce = filterIntegrations(ecommerceIntegrations);
  const filteredMarketing = filterIntegrations(marketingIntegrations);
  const filteredAnalytics = filterIntegrations(analyticsIntegrations);
  const filteredFinancial = filterIntegrations(financialIntegrations);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);
        
        // Auto-fill fields if they exist in the JSON
        setModalForm(prev => ({
          ...prev,
          name: parsed.name || parsed.integrationName || prev.name,
          category: parsed.category || prev.category,
          endpoint: parsed.endpoint || parsed.url || parsed.host || prev.endpoint,
          apiKey: parsed.apiKey || parsed.token || parsed.key || prev.apiKey,
          description: parsed.description || prev.description,
          webhookUrl: parsed.webhookUrl || parsed.webhook || prev.webhookUrl,
          connectionTimeout: parsed.connectionTimeout || parsed.timeout || prev.connectionTimeout
        }));
      } catch (err) {
        console.error("Failed to parse config file", err);
        // In a real app, set an error state here
      }
    };
    reader.readAsText(file);
    // Reset file input value so same file can be selected again if needed
    e.target.value = '';
  };

  const handleInputChange = (field: keyof typeof modalForm, value: string | number) => {
    setModalForm(prev => ({ ...prev, [field]: value }));
  };

  const closeModal = () => {
    setShowAddModal(false);
    setModalForm({
      name: '',
      category: 'E-commerce Source',
      endpoint: '',
      apiKey: '',
      description: '',
      webhookUrl: '',
      connectionTimeout: 30
    });
    setShowModalApiKey(false);
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Integration Ecosystem</h1>
          <p className="text-slate-500 text-sm mt-1">Manage data pipelines, attribution sources, and compliance shields.</p>
        </div>
        <div className="flex flex-col md:flex-row items-center gap-3 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <Icons.Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Search integrations..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all shadow-sm"
            />
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="w-full md:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium rounded-lg shadow-lg shadow-brand-500/20 transition-all whitespace-nowrap"
          >
            <Icons.Plus size={16} />
            Add New Integration
          </button>
        </div>
      </div>

      <ShopifySettings clientId={clientId} clientName={clientName} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* E-commerce Core */}
        {filteredEcommerce.length > 0 && (
          <Card 
            title="E-commerce Core" 
            subtitle="Transaction & Inventory Source of Truth"
            action={<Icons.ShoppingBag className="text-slate-300" size={20} />}
          >
            <div className="space-y-3 mt-4">
              {filteredEcommerce.map(item => (
                <IntegrationRow key={item.id} item={item} />
              ))}
            </div>
          </Card>
        )}

        {/* Marketing Channels */}
        {filteredMarketing.length > 0 && (
          <Card 
            title="Marketing Channels" 
            subtitle="Ad Spend & Creative Performance"
            action={<Icons.Megaphone className="text-slate-300" size={20} />}
          >
            <div className="space-y-3 mt-4">
              {filteredMarketing.map(item => (
                <IntegrationRow key={item.id} item={item} />
              ))}
            </div>
          </Card>
        )}

        {/* Analytics & Attribution */}
        {filteredAnalytics.length > 0 && (
          <Card 
            title="Analytics & Attribution" 
            subtitle="Third-party Validation"
            action={<Icons.BarChart2 className="text-slate-300" size={20} />}
          >
            <div className="space-y-3 mt-4">
              {filteredAnalytics.map(item => (
                <IntegrationRow key={item.id} item={item} />
              ))}
            </div>
          </Card>
        )}

        {/* Financial Data */}
        {filteredFinancial.length > 0 && (
          <Card 
            title="Financial Intelligence" 
            subtitle="COGS, Shipping, & Payment Fees"
            action={<Icons.Database className="text-slate-300" size={20} />}
          >
            <div className="space-y-3 mt-4">
              {filteredFinancial.map(item => (
                <IntegrationRow key={item.id} item={item} />
              ))}
            </div>
          </Card>
        )}
      </div>

      {/* Compliance Infrastructure */}
      <Card 
        title="Compliance & Infrastructure" 
        subtitle="Server-Side GTM & PII Sanitization"
        className="bg-slate-900 bg-gradient-to-br from-slate-900 to-brand-900 text-white border-slate-800"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-2">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                <Icons.Server className="text-emerald-400" size={24} />
              </div>
              <div>
                <h3 className="font-bold text-white">Server-Side Container</h3>
                <p className="text-xs text-slate-400">GTM-SS-01 (us-east-1)</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm border-b border-slate-700/50 pb-2">
                <span className="text-slate-300">Status</span>
                <span className="text-emerald-400 font-mono font-medium">Active • 99.9% Uptime</span>
              </div>
              <div className="flex items-center justify-between text-sm border-b border-slate-700/50 pb-2">
                <span className="text-slate-300">Throughput</span>
                <span className="text-slate-200 font-mono">1.2k events/sec</span>
              </div>
              <div className="flex items-center justify-between text-sm pt-1">
                <span className="text-slate-300">Latency</span>
                <span className="text-slate-200 font-mono">24ms</span>
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-3 mb-4">
               <div className="p-2 bg-brand-500/10 rounded-lg border border-brand-500/20">
                <Icons.ShieldCheck className="text-brand-400" size={24} />
              </div>
              <div>
                <h3 className="font-bold text-white">PII Sanitization</h3>
                <p className="text-xs text-slate-400">CIPA/GDPR/CCPA Protocol</p>
              </div>
            </div>
            <div className="space-y-2">
               <div className="flex items-center justify-between text-sm border-b border-slate-700/50 pb-2">
                <span className="text-slate-300">IP Hashing</span>
                <span className="text-emerald-400 font-medium">Enabled</span>
              </div>
              <div className="flex items-center justify-between text-sm border-b border-slate-700/50 pb-2">
                <span className="text-slate-300">User Agent Scrubbing</span>
                <span className="text-emerald-400 font-medium">Enabled</span>
              </div>
              <div className="flex items-center justify-between text-sm pt-1">
                <span className="text-slate-300">Data Retention</span>
                <span className="text-slate-200 font-mono">30 Days (Rolling)</span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Add New Integration Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 border border-slate-100 relative max-h-[90vh] overflow-y-auto">
            <button 
              onClick={closeModal}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <Icons.Close size={20} />
            </button>
            
            <div className="mb-4">
              <h3 className="text-lg font-bold text-slate-900">Add Custom Integration</h3>
              <p className="text-sm text-slate-500">Connect a new data source or destination to your velocity pipeline.</p>
            </div>

            {/* Config File Upload */}
            <div className="mb-6 p-4 bg-slate-50 border border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center text-center group hover:border-brand-300 transition-colors">
              <div className="p-2 bg-white rounded-full shadow-sm mb-2 group-hover:scale-110 transition-transform">
                <Icons.FileJson className="text-brand-500" size={24} />
              </div>
              <p className="text-xs font-semibold text-slate-700 mb-1">Upload Configuration File</p>
              <p className="text-[10px] text-slate-400 mb-3 max-w-[200px]">Supports JSON files with pre-defined API schemas</p>
              <label className="cursor-pointer relative">
                <span className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-600 shadow-sm hover:bg-slate-50 hover:text-brand-600 transition-colors flex items-center gap-2">
                  <Icons.Upload size={12} />
                  Select File
                </span>
                <input 
                  type="file" 
                  className="hidden" 
                  accept=".json" 
                  onChange={handleFileUpload} 
                />
              </label>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Integration Name</label>
                <input 
                  type="text" 
                  value={modalForm.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all" 
                  placeholder="e.g. Custom ERP Feed" 
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Category</label>
                <select 
                  value={modalForm.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none bg-white text-slate-700 transition-all"
                >
                  <option>E-commerce Source</option>
                  <option>Marketing Channel</option>
                  <option>Analytics Provider</option>
                  <option>Financial / ERP</option>
                  <option>Compliance Tool</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">API Endpoint / Connection URL</label>
                <input 
                  type="text" 
                  value={modalForm.endpoint}
                  onChange={(e) => handleInputChange('endpoint', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all" 
                  placeholder="https://api.example.com/v1" 
                />
              </div>

               <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">API Key / Auth Token (Optional)</label>
                <div className="relative">
                  <input 
                    type={showModalApiKey ? "text" : "password"}
                    value={modalForm.apiKey}
                    onChange={(e) => handleInputChange('apiKey', e.target.value)}
                    className="w-full pl-3 pr-10 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all" 
                    placeholder="sk_live_..." 
                  />
                  <button
                    type="button"
                    onClick={() => setShowModalApiKey(!showModalApiKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                  >
                    {showModalApiKey ? <Icons.EyeOff size={14} /> : <Icons.Eye size={14} />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Webhook URL (Optional)</label>
                    <input 
                      type="text" 
                      value={modalForm.webhookUrl}
                      onChange={(e) => handleInputChange('webhookUrl', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all" 
                      placeholder="https://hooks.slack.com/..." 
                    />
                 </div>
                 <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Connection Timeout (sec)</label>
                    <input 
                      type="number" 
                      min="1"
                      max="300"
                      value={modalForm.connectionTimeout}
                      onChange={(e) => handleInputChange('connectionTimeout', parseInt(e.target.value) || '')}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all" 
                      placeholder="30" 
                    />
                 </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Description</label>
                <textarea 
                  value={modalForm.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none h-20 resize-none transition-all" 
                  placeholder="Describe the data flow and utility of this integration..."
                ></textarea>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-8">
              <button 
                onClick={closeModal}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  // Simulate saving logic
                  closeModal();
                }}
                disabled={!modalForm.name}
                className="px-4 py-2 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 disabled:bg-slate-300 disabled:cursor-not-allowed rounded-lg shadow-md shadow-brand-500/20 transition-colors"
              >
                Save Integration
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};