'use client';

import React, { useState, useEffect } from 'react';
import {
  Download,
  Printer,
  Settings2,
  FileText,
  Save,
  Check,
  Palette,
  Eye,
  Sliders,
} from 'lucide-react';
import { Report, ReportRecord } from '@/lib/types';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { formatCurrency, formatDate } from '@/lib/utils';
import { api } from '@/lib/api';

interface LivePdfViewerProps {
  report: Report;
  records: ReportRecord[];
}

export const LivePdfViewer: React.FC<LivePdfViewerProps> = ({ report, records }) => {
  // Live Template Customization State
  const [reportTitle, setReportTitle] = useState('Campaign Summary');
  const [subtitle, setSubtitle] = useState('Service Detail');
  const [headerDealership, setHeaderDealership] = useState(
    typeof report.dealershipId === 'object' ? (report.dealershipId as any).name : report.name
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

  // Column toggles
  const [columns, setColumns] = useState([
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

  const handleDownloadPdf = async () => {
    setIsDownloading(true);
    try {
      // Trigger browser download of PDF endpoint
      const response = await fetch(`/api/reports/${report._id}/pdf`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${report.name || 'DealerSocket_Report'}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('PDF download failed', err);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleSaveTemplate = async () => {
    try {
      const dealershipId =
        typeof report.dealershipId === 'object' ? (report.dealershipId as any)._id : report.dealershipId;

      await api.post('/templates', {
        dealershipId,
        name: `${report.name} PDF Template`,
        type: 'PDF',
        pdfSettings: {
          reportTitle,
          subtitle,
          headerDealershipName: headerDealership,
          campaignLabel,
          dateRangeText,
          primaryColor,
          columns,
          footerNotes,
        },
      });
      setIsTemplateSaved(true);
      setTimeout(() => setIsTemplateSaved(false), 2500);
    } catch (err) {
      console.error('Template save failed', err);
    }
  };

  const activeColumns = columns.filter((c) => c.visible);

  return (
    <div className="space-y-4">
      {/* Top Controls Bar */}
      <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="default" className="font-semibold">
            Interactive PDF Document View
          </Badge>
          <span className="text-xs text-slate-500">
            {records.length} records formatted into printable template
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowConfigDrawer(!showConfigDrawer)}
            icon={<Sliders className="w-3.5 h-3.5" />}
          >
            Customize Template
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleSaveTemplate}
            icon={isTemplateSaved ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Save className="w-3.5 h-3.5" />}
          >
            {isTemplateSaved ? 'Saved!' : 'Save Template'}
          </Button>

          <Button
            size="sm"
            isLoading={isDownloading}
            onClick={handleDownloadPdf}
            icon={<Download className="w-3.5 h-3.5" />}
          >
            Download as PDF
          </Button>
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
                Date Range Text
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

            <div>
              <span className="block text-[11px] font-semibold text-slate-600 mb-1.5">
                Included Table Columns
              </span>
              <div className="space-y-1 bg-slate-50 p-2 rounded border border-slate-200">
                {columns.map((col, idx) => (
                  <label key={col.key} className="flex items-center gap-2 text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={col.visible}
                      onChange={() => {
                        const updated = [...columns];
                        updated[idx].visible = !updated[idx].visible;
                        setColumns(updated);
                      }}
                      className="rounded text-blue-600"
                    />
                    <span>{col.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Live Visual PDF Sheet Canvas (3 or 4 Cols) */}
        <div className={`${showConfigDrawer ? 'lg:col-span-3' : 'lg:col-span-4'} flex justify-center`}>
          <div className="w-full max-w-4xl bg-white rounded-lg border border-slate-300 shadow-md p-8 min-h-[900px] flex flex-col justify-between font-sans">
            {/* Printable PDF Header */}
            <div>
              <div
                className="p-5 rounded-md border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6"
                style={{ backgroundColor: '#f8fafc', borderLeft: `5px solid ${primaryColor}` }}
              >
                <div>
                  <h1 className="text-xl font-bold tracking-tight" style={{ color: primaryColor }}>
                    {reportTitle}
                  </h1>
                  {subtitle && <p className="text-xs text-slate-500 font-medium">{subtitle}</p>}
                </div>

                <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs">
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
                    <span className="font-bold text-blue-600">{records.length}</span>
                  </div>
                </div>
              </div>

              {/* Table rendering matching DealerSocket PDF */}
              <div className="border border-slate-200 rounded-md overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr style={{ backgroundColor: primaryColor }} className="text-white font-semibold text-[11px] uppercase tracking-wider">
                      {activeColumns.map((c) => (
                        <th key={c.key} className="py-2.5 px-3">
                          {c.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-sans">
                    {records.slice(0, 40).map((r, i) => (
                      <tr key={r._id} className={i % 2 === 1 ? 'bg-slate-50/70' : 'bg-white'}>
                        {activeColumns.map((c) => {
                          let val = '';
                          if (c.key === 'externalEntityId') val = r.externalEntityId || '—';
                          else if (c.key === 'customerName') val = r.customerName || '—';
                          else if (c.key === 'vehicle.year') val = r.vehicle?.year ? String(r.vehicle.year) : '—';
                          else if (c.key === 'vehicle.model') val = r.vehicle?.model || '—';
                          else if (c.key === 'campaignName') val = r.campaignName || '—';
                          else if (c.key === 'eventNumber') val = r.eventNumber || '—';
                          else if (c.key === 'closeDate') val = r.closeDate ? formatDate(r.closeDate) : '—';
                          else if (c.key === 'roAmount') val = r.roAmount !== undefined ? formatCurrency(r.roAmount) : '—';

                          return (
                            <td key={c.key} className="py-2 px-3 text-slate-800">
                              {val}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {records.length > 40 && (
                <div className="text-center py-2 text-xs text-slate-400 font-medium">
                  + {records.length - 40} additional records included in downloadable PDF export
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
    </div>
  );
};
