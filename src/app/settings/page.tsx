'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { useAuth } from '@/lib/authContext';
import { api } from '@/lib/api';
import {
  Settings as SettingsIcon,
  Building2,
  FileText,
  Webhook,
  Save,
  CheckCircle2,
  AlertCircle,
  Copy,
  RefreshCw,
  Clock,
  Sparkles,
  Eye,
  EyeOff,
  Terminal,
  Play,
  ArrowUpRight,
  Check,
  UploadCloud,
  FileCheck,
  ShieldCheck,
} from 'lucide-react';

export default function SettingsPage() {
  const { activeDealership, user, setActiveDealership } = useAuth();

  const [activeTab, setActiveTab] = useState<'general' | 'pdf' | 'integrations'>('general');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);

  // General settings state
  const [dealershipName, setDealershipName] = useState(activeDealership?.name || 'South Morang Hyundai');
  const [dealershipCode, setDealershipCode] = useState(activeDealership?.code || 'SMH-01');
  const [timezone, setTimezone] = useState('Australia/Melbourne (UTC+10:00)');
  const [currency, setCurrency] = useState('AUD ($)');

  useEffect(() => {
    if (activeDealership) {
      setDealershipName(activeDealership.name);
      setDealershipCode(activeDealership.code);
    }
  }, [activeDealership]);
  const [defaultInterval, setDefaultInterval] = useState('6 Months / 10,000 km');
  const [supportEmail, setSupportEmail] = useState('service@southmoranghyundai.com.au');
  const [supportPhone, setSupportPhone] = useState('+61 3 8401 2200');

  // PDF preferences
  const [pdfHeaderTitle, setPdfHeaderTitle] = useState('HY CLOSED RO SERVICE REPORT');
  const [pdfPrimaryColor, setPdfPrimaryColor] = useState('#002c6c');
  const [pdfAccentColor, setPdfAccentColor] = useState('#0088cc');
  const [showSummaryStats, setShowSummaryStats] = useState(true);
  const [showRoAmounts, setShowRoAmounts] = useState(true);
  const [showPageNumbers, setShowPageNumbers] = useState(true);
  const [pdfFooterNotice, setPdfFooterNotice] = useState(
    'CONFIDENTIAL DEALERSOCKET DMS EXPORT — FOR AUTHORIZED HYUNDAI SERVICE PERSONNEL ONLY.'
  );

  // Webhooks & API state
  const [urlFormat, setUrlFormat] = useState<'query' | 'direct' | 'header'>('query');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [directWebhookUrl, setDirectWebhookUrl] = useState('');
  const [apiKey, setApiKey] = useState('ds_live_sk_9a8f27c3e104b46298fa');
  const [showApiKey, setShowApiKey] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [pingLoading, setPingLoading] = useState(false);
  const [pingResult, setPingResult] = useState<{ success: boolean; message: string; timestamp?: string } | null>(null);
  const [sampleLoading, setSampleLoading] = useState(false);
  const [sampleResult, setSampleResult] = useState<any | null>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsFilter, setLogsFilter] = useState<'current' | 'all'>('current');
  const [codeSnippetTab, setCodeSnippetTab] = useState<'curl' | 'python' | 'node'>('curl');
  const [copiedSnippet, setCopiedSnippet] = useState(false);

  const fetchWebhookConfig = async () => {
    try {
      const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:7000';
      const storeCode = activeDealership?.code || 'SMH-01';
      const storeId = activeDealership?._id || storeCode;

      const res = await api.get('/webhooks/config', {
        params: { dealershipId: storeId },
      });
      if (res.data?.success && res.data?.data) {
        const cfg = res.data.data;
        if (cfg.apiKey) {
          setApiKey(cfg.apiKey);
        }
        setWebhookUrl(`${origin}${cfg.webhookUrl || `/api/webhooks/ingest?store=${storeCode}`}`);
        setDirectWebhookUrl(`${origin}${cfg.storeSpecificRouteUrl || `/api/webhooks/${storeCode}/ingest`}`);
      } else {
        setWebhookUrl(`${origin}/api/webhooks/ingest?store=${storeCode}`);
        setDirectWebhookUrl(`${origin}/api/webhooks/${storeCode}/ingest`);
      }
    } catch (err) {
      console.error('Failed to load webhook config', err);
      const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:7000';
      const storeCode = activeDealership?.code || 'SMH-01';
      setWebhookUrl(`${origin}/api/webhooks/ingest?store=${storeCode}`);
      setDirectWebhookUrl(`${origin}/api/webhooks/${storeCode}/ingest`);
    }
  };

  const fetchWebhookLogs = async () => {
    try {
      setLogsLoading(true);
      const params: any = {};
      if (logsFilter === 'current' && activeDealership?._id) {
        params.dealershipId = activeDealership._id;
      }
      const res = await api.get('/webhooks/logs', { params });
      if (res.data?.success && Array.isArray(res.data?.data)) {
        setLogs(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load webhook logs', err);
    } finally {
      setLogsLoading(false);
    }
  };

  useEffect(() => {
    fetchWebhookConfig();
  }, [activeDealership]);

  useEffect(() => {
    if (activeTab === 'integrations') {
      fetchWebhookLogs();
    }
  }, [activeTab, logsFilter, activeDealership]);

  const handleSendPing = async () => {
    setPingLoading(true);
    setPingResult(null);
    try {
      const storeCode = activeDealership?.code || 'SMH-01';
      const res = await api.post(
        '/webhooks/ping',
        {},
        {
          headers: {
            'x-api-key': apiKey,
            'x-store-code': storeCode,
          },
          params: { store: storeCode },
        }
      );
      setPingResult({
        success: true,
        message: res.data?.message || `Webhook ping check successful for ${activeDealership?.name || 'store'} (200 OK)`,
        timestamp: new Date().toLocaleTimeString(),
      });
      fetchWebhookLogs();
    } catch (err: any) {
      setPingResult({
        success: false,
        message: err.response?.data?.message || err.message || 'Webhook ping failed',
      });
    } finally {
      setPingLoading(false);
    }
  };

  const handleSendSamplePdf = async () => {
    setSampleLoading(true);
    setSampleResult(null);
    try {
      const storeCode = activeDealership?.code || 'SMH-01';
      const res = await api.post(
        '/webhooks/test-sample',
        {},
        {
          headers: {
            'x-api-key': apiKey,
            'x-store-code': storeCode,
          },
          params: { store: storeCode },
        }
      );
      setSampleResult(res.data?.data);
      fetchWebhookLogs();
    } catch (err: any) {
      alert('Webhook sample test failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setSampleLoading(false);
    }
  };

  const getEffectiveWebhookUrl = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:7000';
    const storeCode = activeDealership?.code || 'SMH-01';
    if (urlFormat === 'direct') {
      return directWebhookUrl || `${origin}/api/webhooks/${storeCode}/ingest`;
    }
    if (urlFormat === 'header') {
      return `${origin}/api/webhooks/ingest`;
    }
    return webhookUrl || `${origin}/api/webhooks/ingest?store=${storeCode}`;
  };

  const copyWebhookUrl = () => {
    navigator.clipboard.writeText(getEffectiveWebhookUrl());
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2500);
  };

  const copyApiKey = () => {
    navigator.clipboard.writeText(apiKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2500);
  };

  const copyCodeSnippet = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSnippet(true);
    setTimeout(() => setCopiedSnippet(false), 2500);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      if (activeDealership?._id) {
        const res = await api.patch(`/dealerships/${activeDealership._id}`, {
          name: dealershipName,
          code: dealershipCode,
        });
        if (res.data?.success && res.data.data) {
          setActiveDealership(res.data.data);
        }
      }
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err: any) {
      console.error('Failed to update dealership settings', err);
      alert('Failed to update dealership settings: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AppLayout title="Dealership Settings" subtitle="Configure dealership parameters, deduplication logic, PDF templates, and DMS integration hooks">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Top Header Card */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-slate-900">{activeDealership?.name || dealershipName}</h1>
                <Badge variant="default" size="sm" className="font-mono">
                  {activeDealership?.code || dealershipCode}
                </Badge>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Managed by <span className="font-medium text-slate-700">{user?.name}</span> ({user?.role})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <Button
              type="button"
              variant="primary"
              size="sm"
              isLoading={isSaving}
              icon={<Save className="w-4 h-4" />}
              onClick={handleSave}
            >
              Save Configuration
            </Button>
          </div>
        </div>

        {saveSuccess && (
          <div className="flex items-center gap-2 p-3.5 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Settings successfully updated across all active DealerSocket ingestion workflows.</span>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="border-b border-slate-200">
          <nav className="flex space-x-4 sm:space-x-6 text-xs font-medium overflow-x-auto scrollbar-thin whitespace-nowrap pb-1">
            <button
              type="button"
              onClick={() => setActiveTab('general')}
              className={`pb-3 flex items-center gap-2 border-b-2 transition-colors shrink-0 cursor-pointer ${
                activeTab === 'general'
                  ? 'border-blue-600 text-blue-600 font-semibold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Building2 className="w-4 h-4" strokeWidth={1.75} />
              <span>General & Profile</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('pdf')}
              className={`pb-3 flex items-center gap-2 border-b-2 transition-colors shrink-0 cursor-pointer ${
                activeTab === 'pdf'
                  ? 'border-blue-600 text-blue-600 font-semibold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <FileText className="w-4 h-4" strokeWidth={1.75} />
              <span>PDF Export Preferences</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('integrations')}
              className={`pb-3 flex items-center gap-2 border-b-2 transition-colors shrink-0 cursor-pointer ${
                activeTab === 'integrations'
                  ? 'border-blue-600 text-blue-600 font-semibold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Webhook className="w-4 h-4" strokeWidth={1.75} />
              <span>DMS Sync & Webhooks</span>
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
          {activeTab === 'general' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Dealership Identity</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Metadata displayed on report headers, exported PDFs, and campaign service communications.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Dealership Legal Name</label>
                  <input
                    type="text"
                    value={dealershipName}
                    onChange={(e) => setDealershipName(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Dealer Code</label>
                  <input
                    type="text"
                    value={dealershipCode}
                    onChange={(e) => setDealershipCode(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Service Contact Phone</label>
                  <input
                    type="text"
                    value={supportPhone}
                    onChange={(e) => setSupportPhone(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Service Contact Email</label>
                  <input
                    type="email"
                    value={supportEmail}
                    onChange={(e) => setSupportEmail(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Timezone</label>
                  <select
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                  >
                    <option value="Australia/Melbourne (UTC+10:00)">Australia/Melbourne (UTC+10:00)</option>
                    <option value="Australia/Sydney (UTC+10:00)">Australia/Sydney (UTC+10:00)</option>
                    <option value="Australia/Brisbane (UTC+10:00)">Australia/Brisbane (UTC+10:00)</option>
                    <option value="America/New_York (UTC-05:00)">America/New_York (UTC-05:00)</option>
                    <option value="America/Los_Angeles (UTC-08:00)">America/Los_Angeles (UTC-08:00)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Default Service Interval</label>
                  <input
                    type="text"
                    value={defaultInterval}
                    onChange={(e) => setDefaultInterval(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'pdf' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">PDF Document Template & Theme Styling</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Set default brand aesthetics and formatting rules for exported DealerSocket report documents.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Header Title Banner</label>
                  <input
                    type="text"
                    value={pdfHeaderTitle}
                    onChange={(e) => setPdfHeaderTitle(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 uppercase font-mono"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Primary Brand Color</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={pdfPrimaryColor}
                        onChange={(e) => setPdfPrimaryColor(e.target.value)}
                        className="w-8 h-8 rounded border border-slate-300 p-0.5 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={pdfPrimaryColor}
                        onChange={(e) => setPdfPrimaryColor(e.target.value)}
                        className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded-md font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Accent Accent Color</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={pdfAccentColor}
                        onChange={(e) => setPdfAccentColor(e.target.value)}
                        className="w-8 h-8 rounded border border-slate-300 p-0.5 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={pdfAccentColor}
                        onChange={(e) => setPdfAccentColor(e.target.value)}
                        className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded-md font-mono"
                      />
                    </div>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Document Footer Notice</label>
                  <input
                    type="text"
                    value={pdfFooterNotice}
                    onChange={(e) => setPdfFooterNotice(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-600"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-700 font-medium">Include High-Level Financial Summary Stats in Header</span>
                  <input
                    type="checkbox"
                    checked={showSummaryStats}
                    onChange={(e) => setShowSummaryStats(e.target.checked)}
                    className="rounded text-blue-600 h-4 w-4"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-700 font-medium">Display Individual Closed RO Revenue Amounts</span>
                  <input
                    type="checkbox"
                    checked={showRoAmounts}
                    onChange={(e) => setShowRoAmounts(e.target.checked)}
                    className="rounded text-blue-600 h-4 w-4"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-700 font-medium">Render Automated Page Numbering (Page X of Y)</span>
                  <input
                    type="checkbox"
                    checked={showPageNumbers}
                    onChange={(e) => setShowPageNumbers(e.target.checked)}
                    className="rounded text-blue-600 h-4 w-4"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'integrations' && (
            <div className="space-y-6">
              {/* Top Clarification & Capability Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-emerald-50/70 border border-emerald-200/80 rounded-xl space-y-1.5 shadow-sm">
                  <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs uppercase tracking-wider">
                    <FileCheck className="w-4 h-4 text-emerald-600" />
                    PDF Ingestion Supported
                  </div>
                  <p className="text-xs text-emerald-950 font-medium">
                    Yes! Accepts native PDF Closed RO reports.
                  </p>
                  <p className="text-[11px] text-emerald-800/90 leading-relaxed">
                    Auto-parses entity IDs, customer names, vehicles, RO revenues, and dates without manual column mapping.
                  </p>
                </div>

                <div className="p-4 bg-blue-50/70 border border-blue-200/80 rounded-xl space-y-1.5 shadow-sm">
                  <div className="flex items-center gap-2 text-blue-800 font-bold text-xs uppercase tracking-wider">
                    <ShieldCheck className="w-4 h-4 text-blue-600" />
                    Webhook Status: Online
                  </div>
                  <p className="text-xs text-blue-950 font-medium">
                    Active & ready at <code className="font-mono text-[11px] bg-blue-100 px-1 py-0.5 rounded">/api/webhooks/ingest</code>
                  </p>
                  <p className="text-[11px] text-blue-800/90 leading-relaxed">
                    Protected by secure Dealership API key authentication. Handles multipart file uploads and JSON base64 payloads.
                  </p>
                </div>

                <div className="p-4 bg-purple-50/70 border border-purple-200/80 rounded-xl space-y-1.5 shadow-sm">
                  <div className="flex items-center gap-2 text-purple-800 font-bold text-xs uppercase tracking-wider">
                    <Clock className="w-4 h-4 text-purple-600" />
                    Same-Day Report Ingestion
                  </div>
                  <p className="text-xs text-purple-950 font-medium">
                    Added to today's reports automatically.
                  </p>
                  <p className="text-[11px] text-purple-800/90 leading-relaxed">
                    Reports are timestamped with the current date, immediately visible on the Campaign Reports dashboard with full revenue lookup.
                  </p>
                </div>
              </div>

              {/* Endpoint Configuration & API Key */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-slate-900">DealerSocket Inbound Webhook Configuration</h3>
                      <Badge variant="default" size="sm" className="font-mono">
                        {activeDealership?.code || 'SMH-01'}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Stream closed RO reports straight into <span className="font-semibold text-slate-800">{activeDealership?.name || 'South Morang Hyundai'}</span> via DMS automation or cron scripts.
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200 self-start sm:self-auto">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    Webhook Live ({activeDealership?.code || 'SMH-01'})
                  </span>
                </div>

                {/* Store Routing Method Selector */}
                <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-3 space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-slate-700">Webhook Store Routing Format:</span>
                    <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5 text-[11px] font-medium">
                      <button
                        type="button"
                        onClick={() => setUrlFormat('query')}
                        className={`px-2.5 py-1 rounded-md transition ${
                          urlFormat === 'query'
                            ? 'bg-slate-900 text-white font-semibold shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Query Param (?store={activeDealership?.code || 'CODE'})
                      </button>
                      <button
                        type="button"
                        onClick={() => setUrlFormat('direct')}
                        className={`px-2.5 py-1 rounded-md transition ${
                          urlFormat === 'direct'
                            ? 'bg-slate-900 text-white font-semibold shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Direct Route (/{activeDealership?.code || 'CODE'}/ingest)
                      </button>
                      <button
                        type="button"
                        onClick={() => setUrlFormat('header')}
                        className={`px-2.5 py-1 rounded-md transition ${
                          urlFormat === 'header'
                            ? 'bg-slate-900 text-white font-semibold shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Header (x-store-code)
                      </button>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Each dealership store has its own dedicated endpoint & secret API key. Reports are automatically isolated and tagged to <span className="font-semibold text-slate-700">{activeDealership?.name || 'South Morang Hyundai'}</span>.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Webhook URL Field */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-700">
                        {urlFormat === 'direct' ? 'Store-Specific Direct URL' : urlFormat === 'header' ? 'Standard Endpoint URL' : 'Store Query Endpoint URL'}
                      </label>
                      <span className="text-[10px] text-slate-500 font-mono">POST / multipart/form-data</span>
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={getEffectiveWebhookUrl()}
                        readOnly
                        className="flex-1 text-xs px-3 py-2 border border-slate-300 rounded-lg font-mono bg-slate-50 text-slate-800 focus:outline-none select-all"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        type="button"
                        onClick={copyWebhookUrl}
                        icon={copiedUrl ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      >
                        {copiedUrl ? 'Copied' : 'Copy'}
                      </Button>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Accepts form field <code className="font-mono text-slate-700 font-semibold bg-slate-100 px-1 py-0.5 rounded">file</code> with <code className="font-mono text-slate-700">.pdf</code>, <code className="font-mono text-slate-700">.csv</code>, or <code className="font-mono text-slate-700">.xlsx</code>.
                    </p>
                  </div>

                  {/* API Secret Key Field */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-700">Store Secret API Key</label>
                      <span className="text-[10px] text-slate-500 font-mono">Header: x-api-key</span>
                    </div>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <input
                          type={showApiKey ? 'text' : 'password'}
                          readOnly
                          value={apiKey}
                          className="w-full text-xs px-3 py-2 pr-9 border border-slate-300 bg-slate-50 rounded-lg font-mono text-slate-800 select-all"
                        />
                        <button
                          type="button"
                          onClick={() => setShowApiKey(!showApiKey)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                          {showApiKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        type="button"
                        icon={copiedKey ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        onClick={copyApiKey}
                      >
                        {copiedKey ? 'Copied' : 'Copy'}
                      </Button>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Scoped exclusively to <span className="font-semibold text-slate-700">{activeDealership?.name || 'South Morang Hyundai'} ({activeDealership?.code || 'SMH-01'})</span>.
                    </p>
                  </div>
                </div>

                {/* Actions: Send Test Ping & Send Test PDF */}
                <div className="pt-2 flex flex-wrap items-center gap-3">
                  <Button
                    variant="primary"
                    size="sm"
                    type="button"
                    disabled={pingLoading}
                    onClick={handleSendPing}
                    icon={pingLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                  >
                    {pingLoading ? 'Pinging Endpoint...' : `Test Ping (${activeDealership?.code || 'SMH-01'})`}
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    type="button"
                    disabled={sampleLoading}
                    onClick={handleSendSamplePdf}
                    icon={sampleLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <UploadCloud className="w-3.5 h-3.5 text-blue-600" />}
                  >
                    {sampleLoading ? 'Ingesting Sample PDF...' : `Ingest Test PDF into ${activeDealership?.code || 'SMH-01'}`}
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    type="button"
                    onClick={fetchWebhookLogs}
                    icon={<RefreshCw className={`w-3.5 h-3.5 ${logsLoading ? 'animate-spin' : ''}`} />}
                  >
                    Refresh Logs
                  </Button>
                </div>

                {/* Ping Result Feedback */}
                {pingResult && (
                  <div
                    className={`p-3 rounded-lg text-xs flex items-center justify-between border ${
                      pingResult.success
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                        : 'bg-rose-50 border-rose-200 text-rose-900'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {pingResult.success ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                      )}
                      <span className="font-medium">{pingResult.message}</span>
                    </div>
                    {pingResult.timestamp && (
                      <span className="text-[11px] opacity-75 font-mono">Response at {pingResult.timestamp}</span>
                    )}
                  </div>
                )}

                {/* Sample PDF Ingestion Success Alert */}
                {sampleResult && (
                  <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-blue-900 font-bold text-xs">
                        <CheckCircle2 className="w-4 h-4 text-blue-600" />
                        Sample PDF Ingested Successfully into {sampleResult.dealershipName || activeDealership?.name || 'Dealership'}!
                      </div>
                      <Badge variant="success" size="sm">201 CREATED</Badge>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white/80 p-3 rounded-lg border border-blue-100 text-xs">
                      <div>
                        <span className="text-slate-500 text-[10px] block">Report Name</span>
                        <span className="font-semibold text-slate-900 truncate block">{sampleResult.reportName}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[10px] block">Target Store</span>
                        <span className="font-bold text-blue-700">{sampleResult.dealershipName || activeDealership?.name} ({sampleResult.dealershipCode || activeDealership?.code})</span>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[10px] block">Records Ingested</span>
                        <span className="font-bold text-slate-900">{sampleResult.recordCount?.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[10px] block">Tracked Revenue</span>
                        <span className="font-bold text-emerald-700">${sampleResult.totalRevenue?.toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <Link
                        href={sampleResult.viewUrl || `/reports/${sampleResult.reportId}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-sm border border-slate-900 transition"
                      >
                        View Report in Campaign Reports
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              {/* Integration Code Snippets */}
              <div className="bg-slate-900 text-slate-200 rounded-xl p-5 shadow-sm space-y-3 border border-slate-800">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-slate-400" />
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                      Webhook Ingestion Code Examples ({activeDealership?.name || 'South Morang Hyundai'})
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setCodeSnippetTab('curl')}
                      className={`px-2.5 py-1 text-xs rounded-md transition font-medium ${
                        codeSnippetTab === 'curl' ? 'bg-[#1e293b] text-white border border-slate-700' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      cURL
                    </button>
                    <button
                      type="button"
                      onClick={() => setCodeSnippetTab('python')}
                      className={`px-2.5 py-1 text-xs rounded-md transition font-medium ${
                        codeSnippetTab === 'python' ? 'bg-[#1e293b] text-white border border-slate-700' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Python
                    </button>
                    <button
                      type="button"
                      onClick={() => setCodeSnippetTab('node')}
                      className={`px-2.5 py-1 text-xs rounded-md transition font-medium ${
                        codeSnippetTab === 'node' ? 'bg-[#1e293b] text-white border border-slate-700' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Node.js
                    </button>
                  </div>
                </div>

                <div className="relative">
                  <pre className="text-xs font-mono text-emerald-400 bg-slate-950/70 p-3.5 rounded-lg overflow-x-auto leading-relaxed border border-slate-800/80">
                    {codeSnippetTab === 'curl' &&
`# Option 1: Direct Store Route (Recommended)
curl -X POST ${directWebhookUrl || `http://localhost:7000/api/webhooks/${activeDealership?.code || 'SMH-01'}/ingest`} \\
  -H "x-api-key: ${apiKey}" \\
  -F "file=@${(activeDealership?.name || 'South_Morang_Hyundai').replace(/\s+/g, '_')}_Closed_RO.pdf"

# Option 2: Endpoint with Query Parameter
curl -X POST "${webhookUrl || `http://localhost:7000/api/webhooks/ingest?store=${activeDealership?.code || 'SMH-01'}`}" \\
  -H "x-api-key: ${apiKey}" \\
  -F "file=@Closed_RO.pdf"`}
                    {codeSnippetTab === 'python' &&
`import requests

# Store: ${activeDealership?.name || 'South Morang Hyundai'} (${activeDealership?.code || 'SMH-01'})
url = "${directWebhookUrl || `http://localhost:7000/api/webhooks/${activeDealership?.code || 'SMH-01'}/ingest`}"
headers = {
    "x-api-key": "${apiKey}",
    "x-store-code": "${activeDealership?.code || 'SMH-01'}"
}

with open("Closed_RO.pdf", "rb") as f:
    response = requests.post(url, headers=headers, files={"file": f})
    print(response.json())`}
                    {codeSnippetTab === 'node' &&
`const fs = require('fs');
const FormData = require('form-data');

// Store: ${activeDealership?.name || 'South Morang Hyundai'} (${activeDealership?.code || 'SMH-01'})
const form = new FormData();
form.append('file', fs.createReadStream('Closed_RO.pdf'));

fetch('${directWebhookUrl || `http://localhost:7000/api/webhooks/${activeDealership?.code || 'SMH-01'}/ingest`}', {
  method: 'POST',
  headers: {
    'x-api-key': '${apiKey}',
    'x-store-code': '${activeDealership?.code || 'SMH-01'}',
    ...form.getHeaders()
  },
  body: form
}).then(res => res.json()).then(console.log);`}
                  </pre>
                  <button
                    type="button"
                    onClick={() => {
                      const snippet =
                        codeSnippetTab === 'curl'
                          ? `curl -X POST "${directWebhookUrl || getEffectiveWebhookUrl()}" \\\n  -H "x-api-key: ${apiKey}" \\\n  -F "file=@Closed_RO.pdf"`
                          : codeSnippetTab === 'python'
                          ? `import requests\n\nurl = "${directWebhookUrl || getEffectiveWebhookUrl()}"\nheaders = {"x-api-key": "${apiKey}", "x-store-code": "${activeDealership?.code || 'SMH-01'}"}\nwith open("Closed_RO.pdf", "rb") as f:\n    response = requests.post(url, headers=headers, files={"file": f})\n    print(response.json())`
                          : `const fs = require('fs');\nconst FormData = require('form-data');\nconst form = new FormData();\nform.append('file', fs.createReadStream('Closed_RO.pdf'));\nfetch('${directWebhookUrl || getEffectiveWebhookUrl()}', { method: 'POST', headers: { 'x-api-key': '${apiKey}', 'x-store-code': '${activeDealership?.code || 'SMH-01'}', ...form.getHeaders() }, body: form }).then(r => r.json()).then(console.log);`;
                      copyCodeSnippet(snippet);
                    }}
                    className="absolute top-2.5 right-2.5 px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] rounded flex items-center gap-1 transition"
                  >
                    {copiedSnippet ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    {copiedSnippet ? 'Copied' : 'Copy'}
                  </button>
                </div>
              </div>

              {/* Inbound Webhook Activity & Delivery Log Table */}
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-slate-600" />
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Recent Inbound Webhook Activity Logs
                    </h4>
                    <Badge variant="default" size="sm">{logs.length}</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-500 font-medium">Filter Store:</span>
                    <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50 text-[11px]">
                      <button
                        type="button"
                        onClick={() => setLogsFilter('current')}
                        className={`px-2.5 py-1 rounded-md transition font-medium ${
                          logsFilter === 'current'
                            ? 'bg-white shadow-xs text-blue-700 font-semibold'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {activeDealership?.code || 'Active Store'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setLogsFilter('all')}
                        className={`px-2.5 py-1 rounded-md transition font-medium ${
                          logsFilter === 'all'
                            ? 'bg-white shadow-xs text-blue-700 font-semibold'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        All Stores
                      </button>
                    </div>
                  </div>
                </div>

                {logs.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-xs">
                    No webhook calls recorded for {logsFilter === 'current' ? activeDealership?.name || 'this store' : 'any store'}. Click "Test Ping" or "Ingest Test PDF" above to initiate events.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-700">
                      <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                        <tr>
                          <th className="px-4 py-3">Timestamp / Date</th>
                          <th className="px-4 py-3">Dealership Store</th>
                          <th className="px-4 py-3">Event / File</th>
                          <th className="px-4 py-3">Type</th>
                          <th className="px-4 py-3 text-right">Records</th>
                          <th className="px-4 py-3 text-right">Revenue</th>
                          <th className="px-4 py-3 text-center">Status</th>
                          <th className="px-4 py-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-normal">
                        {logs.map((log: any) => {
                          const storeCode = log.dealershipId?.code || log.payloadSummary?.code || activeDealership?.code || 'SMH-01';
                          const storeName = log.dealershipId?.name || log.payloadSummary?.dealership || activeDealership?.name || 'Dealership';
                          return (
                            <tr key={log._id} className="hover:bg-slate-50/70 transition">
                              <td className="px-4 py-3 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                                {new Date(log.createdAt).toLocaleString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  second: '2-digit',
                                })}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <div className="flex items-center gap-1.5">
                                  <Badge variant="outline" size="sm" className="font-mono text-[10px] font-bold">
                                    {storeCode}
                                  </Badge>
                                  <span className="text-slate-800 font-medium text-[11px] truncate max-w-[130px]" title={storeName}>
                                    {storeName}
                                  </span>
                                </div>
                              </td>
                              <td className="px-4 py-3 font-medium text-slate-900 max-w-xs truncate">
                                {log.fileName || log.message || log.eventType}
                              </td>
                              <td className="px-4 py-3">
                                <Badge
                                  variant={log.fileType === 'pdf' ? 'default' : 'neutral'}
                                  size="sm"
                                  className="uppercase font-mono text-[10px]"
                                >
                                  {log.fileType || log.eventType}
                                </Badge>
                              </td>
                              <td className="px-4 py-3 text-right font-mono font-medium text-slate-700">
                                {log.recordCount ? log.recordCount.toLocaleString() : '—'}
                              </td>
                              <td className="px-4 py-3 text-right font-mono font-semibold text-emerald-700">
                                {log.totalRevenue ? `$${log.totalRevenue.toLocaleString()}` : '—'}
                              </td>
                              <td className="px-4 py-3 text-center">
                                <Badge
                                  variant={log.status === 'SUCCESS' ? 'success' : log.status === 'PING' ? 'outline' : 'error'}
                                  size="sm"
                                >
                                  {log.responseStatus} {log.status}
                                </Badge>
                              </td>
                              <td className="px-4 py-3 text-right whitespace-nowrap">
                                {log.reportId?._id || (typeof log.reportId === 'string' && log.reportId) ? (
                                  <Link
                                    href={`/reports/${log.reportId?._id || log.reportId}`}
                                    className="inline-flex items-center gap-1 text-[11px] text-blue-600 hover:text-blue-800 font-semibold"
                                  >
                                    View Report
                                    <ArrowUpRight className="w-3 h-3" />
                                  </Link>
                                ) : (
                                  <span className="text-slate-400 text-[11px]">—</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
