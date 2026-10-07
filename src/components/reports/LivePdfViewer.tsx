'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Download,
  Sliders,
  Save,
  Check,
  Plus,
  Trash2,
  Calendar,
  X,
  ArrowUp,
  ArrowDown,
  Filter,
  Layers,
  Sparkles,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { Report, ReportRecord } from '@/lib/types';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { Modal } from '@/components/common/Modal';
import { formatCurrency, formatDate } from '@/lib/utils';
import { api } from '@/lib/api';
import { downloadAuthenticatedFile } from '@/lib/download';

interface LivePdfViewerProps {
  report: Report;
  records: ReportRecord[];
}

interface ColumnConfig {
  key: string;
  label: string;
  visible: boolean;
  isCustom?: boolean;
}

export const LivePdfViewer: React.FC<LivePdfViewerProps> = ({ report, records }) => {
  // Live Template Customization State
  const [reportTitle, setReportTitle] = useState('Campaign Summary');
  const [subtitle, setSubtitle] = useState('Service Detail');
  const [headerDealership, setHeaderDealership] = useState(
    typeof report.dealershipId === 'object' ? (report.dealershipId as any).name : report.name || 'South Morang Hyundai'
  );
  const [campaignLabel, setCampaignLabel] = useState(report.campaignName || 'HY Closed RO');
  const [dateRangeText, setDateRangeText] = useState(
    report.reportDateFrom && report.reportDateTo
      ? `${formatDate(report.reportDateFrom)} - ${formatDate(report.reportDateTo)}`
      : '9/28/2026 - 10/5/2026'
  );
  const [primaryColor, setPrimaryColor] = useState('#0f172a');
  const [footerNotes, setFooterNotes] = useState('DealerSocket Operations Hub - Confidential');
  const [isDownloading, setIsDownloading] = useState(false);
  const [isTemplateSaved, setIsTemplateSaved] = useState(false);
  const [downloadStatus, setDownloadStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Date Filtering State
  const [dateFilterFrom, setDateFilterFrom] = useState('');
  const [dateFilterTo, setDateFilterTo] = useState('');
  const [activeDatePreset, setActiveDatePreset] = useState<string>('all');

  // Column Configuration State
  const [columns, setColumns] = useState<ColumnConfig[]>([
    { key: 'externalEntityId', label: 'Entity ID', visible: true },
    { key: 'customerName', label: 'Customer Name', visible: true },
    { key: 'vehicle.year', label: 'Year', visible: true },
    { key: 'vehicle.model', label: 'Make/Model', visible: true },
    { key: 'campaignName', label: 'Campaign', visible: true },
    { key: 'eventNumber', label: 'Event#', visible: true },
    { key: 'closeDate', label: 'Close Date', visible: true },
    { key: 'roAmount', label: 'RO Amount', visible: true },
  ]);

  const [showConfigDrawer, setShowConfigDrawer] = useState(false);

  // Add Field Modal State
  const [isAddFieldModalOpen, setIsAddFieldModalOpen] = useState(false);
  const [newFieldKey, setNewFieldKey] = useState('');
  const [newFieldLabel, setNewFieldLabel] = useState('');

  // Discover all unique available fields from loaded records
  const availableFieldSuggestions = useMemo(() => {
    const knownFields = [
      { key: 'customerEmail', label: 'Customer Email' },
      { key: 'vehicle.vin', label: 'Vehicle VIN' },
      { key: 'vehicle.make', label: 'Vehicle Make' },
      { key: 'campaignInsertDate', label: 'Campaign Insert Date' },
      { key: 'customFields.nOrU', label: 'New / Used (N/U)' },
      { key: 'recordStatus', label: 'Record Status' },
      { key: 'validationNotes', label: 'Validation Notes' },
    ];

    // Scan sourceData keys across first 25 records
    const discoveredSourceKeys = new Set<string>();
    records.slice(0, 25).forEach((rec) => {
      if (rec.sourceData && typeof rec.sourceData === 'object') {
        Object.keys(rec.sourceData).forEach((k) => {
          if (k !== 'rawLine' && k !== 'tokens') discoveredSourceKeys.add(k);
        });
      }
      if (rec.customFields && typeof rec.customFields === 'object') {
        Object.keys(rec.customFields).forEach((k) => discoveredSourceKeys.add(k));
      }
    });

    const dynamicFields = Array.from(discoveredSourceKeys).map((k) => ({
      key: k,
      label: k.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase()).trim(),
    }));

    // Merge without duplicates
    const all = [...knownFields];
    dynamicFields.forEach((df) => {
      if (!all.some((a) => a.key === df.key)) {
        all.push(df);
      }
    });

    // Exclude fields already in columns
    return all.filter((s) => !columns.some((c) => c.key === s.key));
  }, [records, columns]);

  // Synchronize dateRangeText when date filter changes
  useEffect(() => {
    if (dateFilterFrom && dateFilterTo) {
      setDateRangeText(`${formatDate(dateFilterFrom)} - ${formatDate(dateFilterTo)}`);
    } else if (dateFilterFrom) {
      setDateRangeText(`From ${formatDate(dateFilterFrom)}`);
    } else if (dateFilterTo) {
      setDateRangeText(`Until ${formatDate(dateFilterTo)}`);
    } else if (report.reportDateFrom && report.reportDateTo) {
      setDateRangeText(`${formatDate(report.reportDateFrom)} - ${formatDate(report.reportDateTo)}`);
    }
  }, [dateFilterFrom, dateFilterTo, report.reportDateFrom, report.reportDateTo]);

  // Handle Quick Date Presets
  const handleDatePreset = (preset: 'all' | '7days' | '30days' | 'thisMonth') => {
    setActiveDatePreset(preset);
    const now = new Date();

    if (preset === 'all') {
      setDateFilterFrom('');
      setDateFilterTo('');
      return;
    }

    if (preset === '7days') {
      const past = new Date();
      past.setDate(now.getDate() - 7);
      setDateFilterFrom(past.toISOString().split('T')[0]);
      setDateFilterTo(now.toISOString().split('T')[0]);
      return;
    }

    if (preset === '30days') {
      const past = new Date();
      past.setDate(now.getDate() - 30);
      setDateFilterFrom(past.toISOString().split('T')[0]);
      setDateFilterTo(now.toISOString().split('T')[0]);
      return;
    }

    if (preset === 'thisMonth') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      setDateFilterFrom(start.toISOString().split('T')[0]);
      setDateFilterTo(now.toISOString().split('T')[0]);
      return;
    }
  };

  // Filter records by date in real time
  const filteredRecords = useMemo(() => {
    if (!dateFilterFrom && !dateFilterTo) return records;

    return records.filter((r) => {
      if (!r.closeDate) return false;
      const recDate = new Date(r.closeDate).toISOString().split('T')[0];
      if (dateFilterFrom && recDate < dateFilterFrom) return false;
      if (dateFilterTo && recDate > dateFilterTo) return false;
      return true;
    });
  }, [records, dateFilterFrom, dateFilterTo]);

  // Load saved columns and custom PDF layout on mount from localStorage
  useEffect(() => {
    try {
      const savedCols = localStorage.getItem(`dealersocket_pdf_columns_${report._id}`);
      if (savedCols) {
        const parsed = JSON.parse(savedCols);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setColumns(parsed);
        }
      }

      const savedSettings = localStorage.getItem(`dealersocket_pdf_settings_${report._id}`);
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        if (parsed.reportTitle) setReportTitle(parsed.reportTitle);
        if (parsed.subtitle) setSubtitle(parsed.subtitle);
        if (parsed.headerDealershipName) setHeaderDealership(parsed.headerDealershipName);
        if (parsed.campaignLabel) setCampaignLabel(parsed.campaignLabel);
        if (parsed.primaryColor) setPrimaryColor(parsed.primaryColor);
        if (parsed.footerNotes) setFooterNotes(parsed.footerNotes);
      }
    } catch (e) {
      console.error('Failed to load saved PDF settings', e);
    }
  }, [report._id]);

  // Save columns helper
  const updateColumns = (newCols: ColumnConfig[]) => {
    setColumns(newCols);
    try {
      localStorage.setItem(`dealersocket_pdf_columns_${report._id}`, JSON.stringify(newCols));

      // Also automatically synchronize with the Record section!
      const activeKeys = new Set(newCols.filter((c) => c.visible).map((c) => c.key));
      const recordCols = {
        entityId: activeKeys.has('externalEntityId'),
        customer: activeKeys.has('customerName'),
        email: activeKeys.has('customerEmail') || activeKeys.has('email'),
        vehicle: Array.from(activeKeys).some((k) => k.startsWith('vehicle')),
        campaign: activeKeys.has('campaignName'),
        eventNumber: activeKeys.has('eventNumber'),
        closeDate: activeKeys.has('closeDate'),
        roAmount: activeKeys.has('roAmount'),
        status: true,
      };
      localStorage.setItem(`dealersocket_record_columns_${report._id}`, JSON.stringify(recordCols));
      window.dispatchEvent(new CustomEvent('columns-updated', { detail: recordCols }));
    } catch (e) {}
  };

  // Add field handler
  const handleAddField = (key: string, label: string) => {
    if (!key.trim() || !label.trim()) return;
    if (columns.some((c) => c.key === key)) {
      // If column was previously added but marked hidden, make it visible
      const updated = columns.map((c) => (c.key === key ? { ...c, visible: true } : c));
      updateColumns(updated);
      setIsAddFieldModalOpen(false);
      return;
    }

    const updated = [
      ...columns,
      {
        key: key.trim(),
        label: label.trim(),
        visible: true,
        isCustom: true,
      },
    ];
    updateColumns(updated);
    setNewFieldKey('');
    setNewFieldLabel('');
    setIsAddFieldModalOpen(false);
  };

  // Remove column handler (works for any column)
  const handleRemoveColumn = (index: number) => {
    const updated = [...columns];
    updated.splice(index, 1);
    updateColumns(updated);
  };

  // Move column order handler
  const handleMoveColumn = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= columns.length) return;
    const updated = [...columns];
    const temp = updated[index];
    updated[index] = updated[targetIdx];
    updated[targetIdx] = temp;
    updateColumns(updated);
  };

  // Dynamic Value Accessor
  const getFieldValue = (record: any, key: string): string => {
    if (!record || !key) return '—';

    // Standard properties
    if (key === 'externalEntityId') return record.externalEntityId || '—';
    if (key === 'customerName') return record.customerName || '—';
    if (key === 'customerEmail' || key === 'email' || key === 'Email') {
      return (
        record.customerEmail ||
        record.customFields?.customerEmail ||
        record.customFields?.email ||
        record.sourceData?.Email ||
        record.sourceData?.email ||
        '—'
      );
    }
    if (key === 'customerPhone' || key === 'phone' || key === 'Phone') {
      return (
        record.customerPhone ||
        record.customFields?.customerPhone ||
        record.customFields?.phone ||
        record.sourceData?.Phone ||
        record.sourceData?.phone ||
        '—'
      );
    }
    if (key === 'vehicle.year' || key === 'year') {
      return record.vehicle?.year ? String(record.vehicle.year) : '—';
    }
    if (key === 'vehicle.model') return record.vehicle?.model || '—';
    if (key === 'vehicle.make') return record.vehicle?.make || '—';
    if (key === 'vehicle.vin' || key === 'vin' || key === 'VIN') {
      return record.vehicle?.vin || record.sourceData?.VIN || record.sourceData?.vin || '—';
    }
    if (key === 'campaignName') return record.campaignName || '—';
    if (key === 'campaignInsertDate') {
      return record.campaignInsertDate ? formatDate(record.campaignInsertDate) : '—';
    }
    if (key === 'eventNumber') return record.eventNumber || '—';
    if (key === 'closeDate') return record.closeDate ? formatDate(record.closeDate) : '—';
    if (key === 'roAmount') {
      return record.roAmount !== undefined && record.roAmount !== null ? formatCurrency(record.roAmount) : '—';
    }
    if (key === 'recordStatus') return record.recordStatus || '—';
    if (key === 'validationNotes') {
      return Array.isArray(record.validationNotes) && record.validationNotes.length > 0
        ? record.validationNotes.join('; ')
        : '—';
    }
    if (key === 'customFields.nOrU' || key === 'nOrU' || key === 'nu' || key === 'N/U') {
      return record.customFields?.nOrU || record.customFields?.nu || record.sourceData?.['N/U'] || '—';
    }

    // Nested dot path resolution
    if (key.includes('.')) {
      const parts = key.split('.');
      let current = record;
      for (const part of parts) {
        current = current?.[part];
      }
      if (current !== undefined && current !== null && current !== '') {
        return String(current);
      }
    }

    // Direct key on record
    if (record[key] !== undefined && record[key] !== null && record[key] !== '') {
      return String(record[key]);
    }

    // Check customFields
    if (record.customFields?.[key] !== undefined && record.customFields?.[key] !== null && record.customFields?.[key] !== '') {
      return String(record.customFields[key]);
    }

    // Check sourceData (exact match or case-insensitive)
    if (record.sourceData) {
      if (record.sourceData[key] !== undefined && record.sourceData[key] !== null && record.sourceData[key] !== '') {
        return String(record.sourceData[key]);
      }
      const lower = key.toLowerCase().replace(/[^a-z0-9]/g, '');
      for (const [k, v] of Object.entries(record.sourceData)) {
        if (k.toLowerCase().replace(/[^a-z0-9]/g, '') === lower && v !== undefined && v !== null && v !== '') {
          return String(v);
        }
      }
    }

    return '—';
  };

  // Download PDF handler with date range and customized columns
  const handleDownloadPdf = async () => {
    setIsDownloading(true);
    setDownloadStatus(null);
    try {
      await downloadAuthenticatedFile({
        url: `/reports/${report._id}/pdf`,
        filename: `${report.name || 'DealerSocket_Report'}.pdf`,
        method: 'POST',
        body: {
          dateFrom: dateFilterFrom || undefined,
          dateTo: dateFilterTo || undefined,
          templateSettings: {
            reportTitle,
            subtitle,
            headerDealershipName: headerDealership,
            campaignLabel,
            dateRangeText,
            primaryColor,
            columns: columns.map((c) => ({
              field: c.key,
              label: c.label,
              visible: c.visible,
            })),
            footerNotes,
          },
        },
      });
      setDownloadStatus({
        type: 'success',
        message: 'PDF report generated and downloaded successfully!',
      });
      setTimeout(() => setDownloadStatus(null), 5000);
    } catch (err: any) {
      console.error('PDF download failed', err);
      setDownloadStatus({
        type: 'error',
        message:
          'Failed to download PDF report: ' +
          (err.response?.data?.message || err.message || 'Request failed. Please verify authentication.'),
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const handleSaveLayout = () => {
    try {
      const layoutSettings = {
        reportTitle,
        subtitle,
        headerDealershipName: headerDealership,
        campaignLabel,
        primaryColor,
        footerNotes,
      };

      localStorage.setItem(`dealersocket_pdf_settings_${report._id}`, JSON.stringify(layoutSettings));
      localStorage.setItem(`dealersocket_pdf_columns_${report._id}`, JSON.stringify(columns));

      // Also automatically synchronize with the Record section!
      const activeKeys = new Set(columns.filter((c) => c.visible).map((c) => c.key));
      const recordCols = {
        entityId: activeKeys.has('externalEntityId'),
        customer: activeKeys.has('customerName'),
        email: activeKeys.has('customerEmail') || activeKeys.has('email'),
        vehicle: Array.from(activeKeys).some((k) => k.startsWith('vehicle')),
        campaign: activeKeys.has('campaignName'),
        eventNumber: activeKeys.has('eventNumber'),
        closeDate: activeKeys.has('closeDate'),
        roAmount: activeKeys.has('roAmount'),
        status: true,
      };
      localStorage.setItem(`dealersocket_record_columns_${report._id}`, JSON.stringify(recordCols));
      window.dispatchEvent(new CustomEvent('columns-updated', { detail: recordCols }));

      setIsTemplateSaved(true);
      setTimeout(() => setIsTemplateSaved(false), 2500);
    } catch (err) {
      console.error('Failed to save layout', err);
    }
  };

  const activeColumns = columns.filter((c) => c.visible);

  return (
    <div className="space-y-4">
      {/* Top Controls Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="default" className="font-semibold bg-slate-800 text-white shrink-0">
            Interactive PDF Document
          </Badge>
          <span className="text-xs text-slate-500 font-medium whitespace-nowrap">
            Showing <strong className="text-blue-600">{filteredRecords.length}</strong> of {records.length} records
          </span>
          {(dateFilterFrom || dateFilterTo) && (
            <span className="text-[11px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded border border-amber-200 font-medium shrink-0">
              Date Filtered
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 sm:flex-none text-xs"
            onClick={() => setIsAddFieldModalOpen(true)}
            icon={<Plus className="w-3.5 h-3.5 text-blue-600" />}
          >
            Add Field
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="flex-1 sm:flex-none text-xs"
            onClick={() => setShowConfigDrawer(!showConfigDrawer)}
            icon={<Sliders className="w-3.5 h-3.5" />}
          >
            {showConfigDrawer ? 'Hide Options' : 'Customize Template'}
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="flex-1 sm:flex-none text-xs"
            onClick={handleSaveLayout}
            icon={isTemplateSaved ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Save className="w-3.5 h-3.5" />}
            title="Save custom layout and column settings for this report"
          >
            {isTemplateSaved ? 'Layout Saved!' : 'Save Layout'}
          </Button>

          <Button
            size="sm"
            className="flex-1 sm:flex-none text-xs font-semibold shadow-xs"
            isLoading={isDownloading}
            onClick={handleDownloadPdf}
            icon={<Download className="w-3.5 h-3.5" />}
          >
            Download as PDF
          </Button>
        </div>
      </div>

      {/* Download Feedback Banner */}
      {downloadStatus && (
        <div
          className={`p-3 rounded-xl text-xs flex items-center justify-between border transition-all shadow-xs ${
            downloadStatus.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {downloadStatus.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span className="font-medium">{downloadStatus.message}</span>
          </div>
          <button
            onClick={() => setDownloadStatus(null)}
            className="text-slate-400 hover:text-slate-600 p-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Date Filter Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 font-semibold text-slate-700 shrink-0">
            <Filter className="w-3.5 h-3.5 text-blue-600" />
            <span>Filter PDF by Date:</span>
          </div>

          <div className="flex flex-wrap items-center gap-1 bg-slate-100 p-0.5 rounded-lg">
            <button
              onClick={() => handleDatePreset('all')}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                activeDatePreset === 'all' && !dateFilterFrom && !dateFilterTo
                  ? 'bg-white text-blue-600 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Dates
            </button>
            <button
              onClick={() => handleDatePreset('7days')}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                activeDatePreset === '7days'
                  ? 'bg-white text-blue-600 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Last 7 Days
            </button>
            <button
              onClick={() => handleDatePreset('30days')}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                activeDatePreset === '30days'
                  ? 'bg-white text-blue-600 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Last 30 Days
            </button>
            <button
              onClick={() => handleDatePreset('thisMonth')}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                activeDatePreset === 'thisMonth'
                  ? 'bg-white text-blue-600 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              This Month
            </button>
          </div>
        </div>

        {/* Date Inputs */}
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          <div className="flex items-center gap-1.5 flex-1 sm:flex-none">
            <label className="text-slate-500 font-medium shrink-0">From:</label>
            <input
              type="date"
              value={dateFilterFrom}
              onChange={(e) => {
                setDateFilterFrom(e.target.value);
                setActiveDatePreset('custom');
              }}
              className="w-full sm:w-auto px-2 py-1 border border-slate-300 rounded text-xs bg-white text-slate-800"
            />
          </div>

          <div className="flex items-center gap-1.5 flex-1 sm:flex-none">
            <label className="text-slate-500 font-medium shrink-0">To:</label>
            <input
              type="date"
              value={dateFilterTo}
              onChange={(e) => {
                setDateFilterTo(e.target.value);
                setActiveDatePreset('custom');
              }}
              className="w-full sm:w-auto px-2 py-1 border border-slate-300 rounded text-xs bg-white text-slate-800"
            />
          </div>

          {(dateFilterFrom || dateFilterTo) && (
            <button
              onClick={() => handleDatePreset('all')}
              className="flex items-center gap-1 text-[11px] text-rose-600 hover:text-rose-700 font-medium px-2 py-1 rounded hover:bg-rose-50 transition ml-auto sm:ml-0"
            >
              <X className="w-3 h-3" />
              Reset Date
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Template Customizer Sidebar (1 Col when open) */}
        {showConfigDrawer && (
          <div className="lg:col-span-1 bg-white p-4 rounded-lg border border-slate-200 shadow-xs space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="font-semibold text-slate-800 uppercase tracking-wider text-[11px]">
                PDF Template Options
              </span>
              <button
                onClick={() => setShowConfigDrawer(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Report Title
              </label>
              <input
                type="text"
                value={reportTitle}
                onChange={(e) => setReportTitle(e.target.value)}
                className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded bg-white"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Subtitle
              </label>
              <input
                type="text"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded bg-white"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Header Dealership Name
              </label>
              <input
                type="text"
                value={headerDealership}
                onChange={(e) => setHeaderDealership(e.target.value)}
                className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded bg-white"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Campaign Name
              </label>
              <input
                type="text"
                value={campaignLabel}
                onChange={(e) => setCampaignLabel(e.target.value)}
                className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded bg-white"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Date Range Text in PDF
              </label>
              <input
                type="text"
                value={dateRangeText}
                onChange={(e) => setDateRangeText(e.target.value)}
                className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded bg-white"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Accent Theme Color
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="w-7 h-7 rounded border border-slate-300 cursor-pointer p-0.5"
                />
                <span className="font-mono text-slate-600">{primaryColor}</span>
              </div>
            </div>

            {/* Included Columns Management */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="block text-[11px] font-semibold text-slate-600">
                  Table Columns ({activeColumns.length} visible)
                </span>
                <button
                  onClick={() => setIsAddFieldModalOpen(true)}
                  className="text-[11px] text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-0.5"
                >
                  <Plus className="w-3 h-3" />
                  Add Field
                </button>
              </div>

              <div className="space-y-1.5 bg-slate-50 p-2 rounded border border-slate-200 max-h-72 overflow-y-auto">
                {columns.map((col, idx) => (
                  <div
                    key={col.key}
                    className="flex items-center justify-between gap-1 bg-white p-1.5 rounded border border-slate-200 text-xs"
                  >
                    <label className="flex items-center gap-2 text-slate-700 cursor-pointer flex-1 min-w-0">
                      <input
                        type="checkbox"
                        checked={col.visible}
                        onChange={() => {
                          const updated = [...columns];
                          updated[idx].visible = !updated[idx].visible;
                          updateColumns(updated);
                        }}
                        className="rounded text-blue-600"
                      />
                      <span className="truncate font-medium text-[11px]">{col.label}</span>
                    </label>

                    <div className="flex items-center gap-1 text-slate-400">
                      <button
                        title="Move Up"
                        disabled={idx === 0}
                        onClick={() => handleMoveColumn(idx, 'up')}
                        className="hover:text-slate-700 disabled:opacity-30 p-0.5"
                      >
                        <ArrowUp className="w-3 h-3" />
                      </button>
                      <button
                        title="Move Down"
                        disabled={idx === columns.length - 1}
                        onClick={() => handleMoveColumn(idx, 'down')}
                        className="hover:text-slate-700 disabled:opacity-30 p-0.5"
                      >
                        <ArrowDown className="w-3 h-3" />
                      </button>
                      <button
                        title="Delete Column"
                        onClick={() => handleRemoveColumn(idx)}
                        className="hover:text-rose-600 text-slate-400 p-0.5 ml-0.5 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Live Visual PDF Sheet Canvas (3 or 4 Cols) */}
        <div className={`${showConfigDrawer ? 'lg:col-span-3' : 'lg:col-span-4'} flex justify-center w-full min-w-0 overflow-hidden`}>
          <div className="w-full max-w-5xl bg-white rounded-xl border border-slate-300 shadow-md p-4 sm:p-6 md:p-8 min-h-[700px] flex flex-col justify-between font-sans overflow-hidden">
            {/* Printable PDF Header */}
            <div>
              <div
                className="p-4 sm:p-5 rounded-lg border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6"
                style={{ backgroundColor: '#f8fafc', borderLeft: `5px solid ${primaryColor}` }}
              >
                <div className="min-w-0">
                  <h1 className="text-lg sm:text-xl font-bold tracking-tight truncate" style={{ color: primaryColor }}>
                    {reportTitle}
                  </h1>
                  {subtitle && <p className="text-xs text-slate-500 font-medium truncate">{subtitle}</p>}
                </div>

                <div className="grid grid-cols-2 gap-x-4 sm:gap-x-6 gap-y-1 text-xs shrink-0">
                  <div>
                    <span className="font-semibold text-slate-600">Report:</span>{' '}
                    <span className="text-slate-900 font-medium">{headerDealership}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-600">Campaign:</span>{' '}
                    <span className="text-slate-900 font-medium">{campaignLabel}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-600">Report Date:</span>{' '}
                    <span className="text-slate-900 font-medium">{dateRangeText}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-600">Record Count:</span>{' '}
                    <span className="font-bold text-blue-600">{filteredRecords.length}</span>
                  </div>
                </div>
              </div>

              {/* Table rendering matching DealerSocket PDF */}
              <div className="border border-slate-200 rounded-lg overflow-x-auto max-h-[550px] shadow-2xs">
                <table className="w-full text-left text-xs border-collapse min-w-[680px]">
                  <thead className="sticky top-0 z-10">
                    <tr style={{ backgroundColor: primaryColor }} className="text-white font-semibold text-[11px] uppercase tracking-wider shadow-xs">
                      {activeColumns.map((c) => (
                        <th key={c.key} className="py-2.5 px-3 whitespace-nowrap">
                          {c.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-sans">
                    {filteredRecords.length === 0 ? (
                      <tr>
                        <td colSpan={activeColumns.length} className="py-12 text-center text-slate-400">
                          No records match the selected date range ({dateRangeText}).
                        </td>
                      </tr>
                    ) : (
                      filteredRecords.slice(0, 40).map((r, i) => (
                        <tr key={r._id || i} className={i % 2 === 1 ? 'bg-slate-50/70' : 'bg-white'}>
                          {activeColumns.map((c) => (
                            <td key={c.key} className="py-2 px-3 text-slate-800 whitespace-nowrap text-[11px]">
                              {getFieldValue(r, c.key)}
                            </td>
                          ))}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {filteredRecords.length > 40 && (
                <div className="text-center py-2 text-xs text-slate-400 font-medium">
                  + {filteredRecords.length - 40} additional records included in downloadable PDF export
                </div>
              )}
            </div>

            {/* Printable PDF Footer */}
            <div className="mt-8 pt-4 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-400">
              <span>{footerNotes}</span>
              <span>Generated on {new Date().toLocaleDateString()} · Page 1 of 1</span>
            </div>
          </div>
        </div>
      </div>

      {/* Add Field / Column Modal */}
      <Modal
        isOpen={isAddFieldModalOpen}
        onClose={() => setIsAddFieldModalOpen(false)}
        title="Add Field to PDF Template"
      >
        <div className="space-y-4 text-xs">
          <div>
            <span className="block font-semibold text-slate-700 mb-1">
              Select an Available / Detected Field:
            </span>
            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1 bg-slate-50 rounded border border-slate-200">
              {availableFieldSuggestions.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => {
                    setNewFieldKey(item.key);
                    setNewFieldLabel(item.label);
                  }}
                  className={`text-left p-2 rounded border transition-all text-xs ${
                    newFieldKey === item.key
                      ? 'bg-blue-50 border-blue-500 text-blue-700 font-semibold'
                      : 'bg-white border-slate-200 hover:border-slate-300 text-slate-800'
                  }`}
                >
                  <div className="font-medium truncate">{item.label}</div>
                  <div className="text-[10px] text-slate-400 font-mono truncate">{item.key}</div>
                </button>
              ))}
              {availableFieldSuggestions.length === 0 && (
                <div className="col-span-2 py-4 text-center text-slate-400">
                  All detected fields are already added to the table.
                </div>
              )}
            </div>
          </div>

          <div className="border-t border-slate-100 pt-3 space-y-3">
            <span className="block font-semibold text-slate-700">
              Or Define a Custom Field / Column:
            </span>

            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">
                Field Key (Property Name or Raw Header)
              </label>
              <input
                type="text"
                placeholder="e.g. vehicle.vin, technician, or sourceData.RO #"
                value={newFieldKey}
                onChange={(e) => setNewFieldKey(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white text-xs font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">
                Column Header Label (Displayed in PDF Header)
              </label>
              <input
                type="text"
                placeholder="e.g. Vehicle VIN, Technician, RO Number"
                value={newFieldLabel}
                onChange={(e) => setNewFieldLabel(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white text-xs"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAddFieldModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={!newFieldKey.trim() || !newFieldLabel.trim()}
              onClick={() => handleAddField(newFieldKey, newFieldLabel)}
              icon={<Plus className="w-3.5 h-3.5" />}
            >
              Add Field to PDF
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
