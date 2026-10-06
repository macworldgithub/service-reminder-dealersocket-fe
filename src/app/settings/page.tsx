'use client';

import React, { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { useAuth } from '@/lib/authContext';
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

  // Webhooks & API
  const [webhookUrl, setWebhookUrl] = useState('https://hooks.dealersocket.com/events/v2/closed-ro');
  const [apiKey] = useState('dsk_live_891e4a029cb37f81a7b52048591f');

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

  const copyApiKey = () => {
    navigator.clipboard.writeText(apiKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2500);
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
              <div>
                <h3 className="text-sm font-semibold text-slate-900">DealerSocket DMS & Automated Webhooks</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Connect direct ingestion pipelines with DealerSocket CRM, Hyundai Dealer Portal, and downstream notification services.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Webhook Endpoint URL</label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={webhookUrl}
                      onChange={(e) => setWebhookUrl(e.target.value)}
                      className="flex-1 text-xs px-3 py-2 border border-slate-300 rounded-md font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    <Button variant="outline" size="sm" type="button" onClick={() => alert('Webhook test ping sent (HTTP 200 OK)')}>
                      Send Test Ping
                    </Button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">API Secret Key</label>
                  <div className="flex gap-2">
                    <input
                      type="password"
                      readOnly
                      value={apiKey}
                      className="flex-1 text-xs px-3 py-2 border border-slate-200 bg-slate-50 rounded-md font-mono text-slate-600 select-all"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      type="button"
                      icon={copiedKey ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      onClick={copyApiKey}
                    >
                      {copiedKey ? 'Copied!' : 'Copy Key'}
                    </Button>
                  </div>
                </div>

                <div className="p-3.5 bg-blue-50/50 border border-blue-200/60 rounded-lg text-xs space-y-1.5 text-slate-700">
                  <div className="font-semibold text-blue-900 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-blue-600" />
                    Automatic Event Dispatch
                  </div>
                  <p className="text-slate-600 text-[11px]">
                    Whenever a report finishes ingestion and validation, DealerSocket events will post JSON payloads to your configured webhook endpoint.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
