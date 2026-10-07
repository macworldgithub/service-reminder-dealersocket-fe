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
  Sliders,
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
  const { activeDealership, user } = useAuth();

  const [activeTab, setActiveTab] = useState<'general' | 'dedup' | 'pdf' | 'integrations'>('general');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);

  // General settings state
  const [dealershipName, setDealershipName] = useState(activeDealership?.name || 'South Morang Hyundai');
  const [dealershipCode, setDealershipCode] = useState(activeDealership?.code || 'SMH-01');
  const [timezone, setTimezone] = useState('Australia/Melbourne (UTC+10:00)');
  const [currency, setCurrency] = useState('AUD ($)');
  const [defaultInterval, setDefaultInterval] = useState('6 Months / 10,000 km');
  const [supportEmail, setSupportEmail] = useState('service@southmoranghyundai.com.au');
  const [supportPhone, setSupportPhone] = useState('+61 3 8401 2200');

  // Deduplication settings state
  const [dedupKey, setDedupKey] = useState<'eventNumber' | 'vin_roDate' | 'entityId'>('eventNumber');
  const [dedupAction, setDedupAction] = useState<'flag' | 'skip' | 'overwrite'>('flag');
  const [autoApproveClean, setAutoApproveClean] = useState(true);
  const [requireManualReviewOnError, setRequireManualReviewOnError] = useState(true);

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
  const [webhookUrl, setWebhookUrl] = useState('http://localhost:7000/api/webhooks/ingest');
  const [apiKey, setApiKey] = useState('ds_live_sk_9a8f27c3e104b46298fa');
  const [showApiKey, setShowApiKey] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [pingLoading, setPingLoading] = useState(false);
  const [pingResult, setPingResult] = useState<{ success: boolean; message: string; timestamp?: string } | null>(null);
  const [sampleLoading, setSampleLoading] = useState(false);
  const [sampleResult, setSampleResult] = useState<any | null>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [codeSnippetTab, setCodeSnippetTab] = useState<'curl' | 'python' | 'node'>('curl');
  const [copiedSnippet, setCopiedSnippet] = useState(false);

  const fetchWebhookLogs = async () => {
    try {
      setLogsLoading(true);
      const res = await api.get('/webhooks/logs');
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
    if (activeTab === 'integrations') {
      fetchWebhookLogs();
    }
  }, [activeTab]);

  const handleSendPing = async () => {
    setPingLoading(true);
    setPingResult(null);
    try {
      const res = await api.post(
        '/webhooks/ping',
        {},
        { headers: { 'x-api-key': apiKey } }
      );
      setPingResult({
        success: true,
        message: res.data?.message || 'Webhook ping check successful (200 OK)',
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
      const res = await api.post(
        '/webhooks/test-sample?sample=SMHY-(NSD)S-Rmndr(Mtdr).pdf',
        {},
        { headers: { 'x-api-key': apiKey } }
      );
      setSampleResult(res.data?.data);
      fetchWebhookLogs();
    } catch (err: any) {
      alert('Webhook sample test failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setSampleLoading(false);
    }
  };

  const copyWebhookUrl = () => {
    navigator.clipboard.writeText(webhookUrl);
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

    // Simulate save / mock API call
    setTimeout(() => {
      setIsSaving(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    }, 600);
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
          <nav className="flex space-x-6 text-xs font-medium">
            <button
              type="button"
              onClick={() => setActiveTab('general')}
              className={`pb-3 flex items-center gap-2 border-b-2 transition-colors ${
                activeTab === 'general'
                  ? 'border-blue-600 text-blue-600 font-semibold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <SettingsIcon className="w-4 h-4" />
              <span>General & Profile</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('dedup')}
              className={`pb-3 flex items-center gap-2 border-b-2 transition-colors ${
                activeTab === 'dedup'
                  ? 'border-blue-600 text-blue-600 font-semibold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Sliders className="w-4 h-4" />
              <span>Deduplication & Validation</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('pdf')}
              className={`pb-3 flex items-center gap-2 border-b-2 transition-colors ${
                activeTab === 'pdf'
                  ? 'border-blue-600 text-blue-600 font-semibold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>PDF Export Preferences</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('integrations')}
              className={`pb-3 flex items-center gap-2 border-b-2 transition-colors ${
                activeTab === 'integrations'
                  ? 'border-blue-600 text-blue-600 font-semibold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Webhook className="w-4 h-4" />
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

          {activeTab === 'dedup' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Deduplication & Record Integrity</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Controls how duplicate RO records are matched and handled during ingestion.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-2">Unique Deduplication Key</label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <label
                      className={`flex flex-col p-3 rounded-lg border cursor-pointer transition-colors ${
                        dedupKey === 'eventNumber'
                          ? 'border-blue-600 bg-blue-50/40 text-blue-900'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="dedupKey"
                          checked={dedupKey === 'eventNumber'}
                          onChange={() => setDedupKey('eventNumber')}
                          className="text-blue-600"
                        />
                        <span className="text-xs font-semibold">Event Number (RO#)</span>
                      </div>
                      <span className="text-[11px] text-slate-500 mt-1 pl-5">
                        Matches by unique DealerSocket event ID (e.g. EV-89012). Recommended for accurate closed ROs.
                      </span>
                    </label>

                    <label
                      className={`flex flex-col p-3 rounded-lg border cursor-pointer transition-colors ${
                        dedupKey === 'vin_roDate'
                          ? 'border-blue-600 bg-blue-50/40 text-blue-900'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="dedupKey"
                          checked={dedupKey === 'vin_roDate'}
                          onChange={() => setDedupKey('vin_roDate')}
                          className="text-blue-600"
                        />
                        <span className="text-xs font-semibold">VIN + RO Close Date</span>
                      </div>
                      <span className="text-[11px] text-slate-500 mt-1 pl-5">
                        Combines Vehicle Identification Number with the closed repair order date.
                      </span>
                    </label>

                    <label
                      className={`flex flex-col p-3 rounded-lg border cursor-pointer transition-colors ${
                        dedupKey === 'entityId'
                          ? 'border-blue-600 bg-blue-50/40 text-blue-900'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="dedupKey"
                          checked={dedupKey === 'entityId'}
                          onChange={() => setDedupKey('entityId')}
                          className="text-blue-600"
                        />
                        <span className="text-xs font-semibold">Entity ID (Customer)</span>
                      </div>
                      <span className="text-[11px] text-slate-500 mt-1 pl-5">
                        Matches solely by DealerSocket customer Entity ID (e.g. E10481).
                      </span>
                    </label>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100">
                  <label className="block text-xs font-semibold text-slate-700 mb-2">Duplicate Resolution Action</label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <label
                      className={`flex items-center gap-2.5 p-3 rounded-lg border cursor-pointer transition-colors ${
                        dedupAction === 'flag'
                          ? 'border-blue-600 bg-blue-50/40 text-blue-900 font-medium'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <input
                        type="radio"
                        name="dedupAction"
                        checked={dedupAction === 'flag'}
                        onChange={() => setDedupAction('flag')}
                        className="text-blue-600"
                      />
                      <span className="text-xs">Flag as Duplicate for Review</span>
                    </label>

                    <label
                      className={`flex items-center gap-2.5 p-3 rounded-lg border cursor-pointer transition-colors ${
                        dedupAction === 'skip'
                          ? 'border-blue-600 bg-blue-50/40 text-blue-900 font-medium'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <input
                        type="radio"
                        name="dedupAction"
                        checked={dedupAction === 'skip'}
                        onChange={() => setDedupAction('skip')}
                        className="text-blue-600"
                      />
                      <span className="text-xs">Silently Skip Existing Records</span>
                    </label>

                    <label
                      className={`flex items-center gap-2.5 p-3 rounded-lg border cursor-pointer transition-colors ${
                        dedupAction === 'overwrite'
                          ? 'border-blue-600 bg-blue-50/40 text-blue-900 font-medium'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <input
                        type="radio"
                        name="dedupAction"
                        checked={dedupAction === 'overwrite'}
                        onChange={() => setDedupAction('overwrite')}
                        className="text-blue-600"
                      />
                      <span className="text-xs">Overwrite / Update Existing Record</span>
                    </label>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-semibold text-slate-800">Auto-Approve Valid Records</div>
                      <div className="text-[11px] text-slate-500">
                        Automatically mark records with 0 validation errors as APPROVED during batch commit.
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={autoApproveClean}
                      onChange={(e) => setAutoApproveClean(e.target.checked)}
                      className="rounded text-blue-600 h-4 w-4"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-semibold text-slate-800">Enforce Strict Manual Review on Missing VIN</div>
                      <div className="text-[11px] text-slate-500">
                        Hold entire import for review if any record lacks a 17-character VIN.
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={requireManualReviewOnError}
                      onChange={(e) => setRequireManualReviewOnError(e.target.checked)}
                      className="rounded text-blue-600 h-4 w-4"
                    />
                  </div>
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
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">DealerSocket Inbound Webhook Configuration</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Configure your DMS or external cron script to stream closed RO reports straight into South Morang Hyundai.
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    Webhook Live
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Webhook URL Field */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-700">Inbound Webhook Endpoint URL</label>
                      <span className="text-[10px] text-slate-500 font-mono">POST / multipart/form-data</span>
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={webhookUrl}
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
                      <label className="text-xs font-bold text-slate-700">Dealership API Secret Key</label>
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
                      Scoped to <span className="font-semibold text-slate-700">South Morang Hyundai (SMH-01)</span>. Keep this key confidential.
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
                    {pingLoading ? 'Pinging Endpoint...' : 'Send Test Ping'}
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    type="button"
                    disabled={sampleLoading}
                    onClick={handleSendSamplePdf}
                    icon={sampleLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <UploadCloud className="w-3.5 h-3.5 text-blue-600" />}
                  >
                    {sampleLoading ? 'Ingesting Sample PDF (609 Rows)...' : 'Send Test PDF via Webhook'}
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
                        Sample PDF Ingested Successfully via Webhook!
                      </div>
                      <Badge variant="success" size="sm">201 CREATED</Badge>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white/80 p-3 rounded-lg border border-blue-100 text-xs">
                      <div>
                        <span className="text-slate-500 text-[10px] block">Report Name</span>
                        <span className="font-semibold text-slate-900 truncate block">{sampleResult.reportName}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[10px] block">Records Ingested</span>
                        <span className="font-bold text-blue-700">{sampleResult.recordCount?.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[10px] block">Tracked Revenue</span>
                        <span className="font-bold text-emerald-700">${sampleResult.totalRevenue?.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[10px] block">Ingestion Date</span>
                        <span className="font-semibold text-slate-700">Today ({new Date(sampleResult.ingestedAt).toLocaleTimeString()})</span>
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <Link
                        href={sampleResult.viewUrl || `/reports/${sampleResult.reportId}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition"
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
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-blue-400" />
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                      Webhook Ingestion Code Examples
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setCodeSnippetTab('curl')}
                      className={`px-2.5 py-1 text-xs rounded-md transition font-medium ${
                        codeSnippetTab === 'curl' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      cURL
                    </button>
                    <button
                      type="button"
                      onClick={() => setCodeSnippetTab('python')}
                      className={`px-2.5 py-1 text-xs rounded-md transition font-medium ${
                        codeSnippetTab === 'python' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Python
                    </button>
                    <button
                      type="button"
                      onClick={() => setCodeSnippetTab('node')}
                      className={`px-2.5 py-1 text-xs rounded-md transition font-medium ${
                        codeSnippetTab === 'node' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Node.js
                    </button>
                  </div>
                </div>

                <div className="relative">
                  <pre className="text-xs font-mono text-emerald-400 bg-slate-950/70 p-3.5 rounded-lg overflow-x-auto leading-relaxed border border-slate-800/80">
                    {codeSnippetTab === 'curl' &&
`curl -X POST http://localhost:7000/api/webhooks/ingest \\
  -H "x-api-key: ${apiKey}" \\
  -F "file=@HY_Closed_RO.pdf"`}
                    {codeSnippetTab === 'python' &&
`import requests

url = "http://localhost:7000/api/webhooks/ingest"
headers = {"x-api-key": "${apiKey}"}

with open("HY_Closed_RO.pdf", "rb") as f:
    response = requests.post(url, headers=headers, files={"file": f})
    print(response.json())`}
                    {codeSnippetTab === 'node' &&
`const fs = require('fs');
const FormData = require('form-data');

const form = new FormData();
form.append('file', fs.createReadStream('HY_Closed_RO.pdf'));

fetch('http://localhost:7000/api/webhooks/ingest', {
  method: 'POST',
  headers: {
    'x-api-key': '${apiKey}',
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
                          ? `curl -X POST http://localhost:7000/api/webhooks/ingest \\\n  -H "x-api-key: ${apiKey}" \\\n  -F "file=@HY_Closed_RO.pdf"`
                          : codeSnippetTab === 'python'
                          ? `import requests\n\nurl = "http://localhost:7000/api/webhooks/ingest"\nheaders = {"x-api-key": "${apiKey}"}\nwith open("HY_Closed_RO.pdf", "rb") as f:\n    response = requests.post(url, headers=headers, files={"file": f})\n    print(response.json())`
                          : `const fs = require('fs');\nconst FormData = require('form-data');\nconst form = new FormData();\nform.append('file', fs.createReadStream('HY_Closed_RO.pdf'));\nfetch('http://localhost:7000/api/webhooks/ingest', { method: 'POST', headers: { 'x-api-key': '${apiKey}', ...form.getHeaders() }, body: form }).then(r => r.json()).then(console.log);`;
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
                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-slate-600" />
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Recent Inbound Webhook Activity Logs
                    </h4>
                    <Badge variant="default" size="sm">{logs.length}</Badge>
                  </div>
                  <span className="text-[11px] text-slate-500">Live delivery history</span>
                </div>

                {logs.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-xs">
                    No webhook calls recorded yet. Click "Send Test Ping" or "Send Test PDF via Webhook" to initiate events.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-700">
                      <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                        <tr>
                          <th className="px-4 py-3">Timestamp / Date</th>
                          <th className="px-4 py-3">Event / File</th>
                          <th className="px-4 py-3">Type</th>
                          <th className="px-4 py-3 text-right">Records</th>
                          <th className="px-4 py-3 text-right">Revenue</th>
                          <th className="px-4 py-3 text-center">Status</th>
                          <th className="px-4 py-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-normal">
                        {logs.map((log: any) => (
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
                        ))}
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
