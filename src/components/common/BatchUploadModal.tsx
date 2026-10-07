'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import {
  UploadCloud,
  FileText,
  FileSpreadsheet,
  X,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Loader2,
  Calendar,
  Layers,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { Modal } from './Modal';
import { Button } from './Button';
import { Badge } from './Badge';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/authContext';
import { formatFileSize, formatDate } from '@/lib/utils';

interface BatchUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface QueuedFile {
  file: File;
  id: string;
}

interface ProcessedReportResult {
  reportId: string;
  name: string;
  sourceFileName: string;
  recordCount: number;
  reportDateFrom?: string;
  reportDateTo?: string;
  dateRange?: string;
  status: string;
}

export const BatchUploadModal: React.FC<BatchUploadModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { activeDealership } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [filesQueue, setFilesQueue] = useState<QueuedFile[]>([]);
  const [campaignName, setCampaignName] = useState('HY Closed RO');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [progressText, setProgressText] = useState('');

  // Results state
  const [batchResult, setBatchResult] = useState<{
    successful: ProcessedReportResult[];
    failed: Array<{ fileName: string; error: string }>;
    totalRecordsIngested: number;
  } | null>(null);

  const handleFileSelect = (newFiles: FileList | null) => {
    if (!newFiles) return;
    const additions: QueuedFile[] = [];
    for (let i = 0; i < newFiles.length; i++) {
      const f = newFiles[i];
      // Only allow PDF, CSV, XLSX
      const ext = f.name.split('.').pop()?.toLowerCase();
      if (['pdf', 'csv', 'xlsx', 'xls'].includes(ext || '')) {
        additions.push({
          file: f,
          id: `${f.name}-${f.size}-${Date.now()}-${Math.random()}`,
        });
      }
    }
    setFilesQueue((prev) => [...prev, ...additions]);
    setErrorMessage('');
  };

  const handleRemoveFile = (id: string) => {
    setFilesQueue((prev) => prev.filter((item) => item.id !== id));
  };

  const handleReset = () => {
    setFilesQueue([]);
    setBatchResult(null);
    setErrorMessage('');
    setProgressText('');
    setIsProcessing(false);
  };

  const handleProcessAll = async () => {
    if (filesQueue.length === 0 || !activeDealership) return;
    setIsProcessing(true);
    setErrorMessage('');
    setProgressText(`Preparing ${filesQueue.length} reports for multi-batch processing...`);

    try {
      const formData = new FormData();
      formData.append('dealershipId', activeDealership._id);
      if (campaignName) formData.append('campaignName', campaignName);

      filesQueue.forEach((item) => {
        formData.append('files', item.file);
      });

      setProgressText(`Parsing and extracting records across ${filesQueue.length} files...`);

      const res = await api.post('/imports/upload-batch', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data?.success && res.data.data) {
        setBatchResult(res.data.data);
        if (onSuccess) onSuccess();
      } else {
        setErrorMessage(res.data?.message || 'Batch upload failed');
      }
    } catch (err: any) {
      console.error('Batch upload error', err);
      setErrorMessage(
        err.response?.data?.message || 'Server error occurred during multi-PDF ingestion'
      );
    } finally {
      setIsProcessing(false);
      setProgressText('');
    }
  };

  const handleModalClose = () => {
    if (isProcessing) return;
    handleReset();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleModalClose}
      title={batchResult ? 'Batch Ingestion Complete' : 'Multi-PDF Batch Ingestion'}
      maxWidth="2xl"
    >
      <div className="space-y-4">
        {/* Step 1: Uploading & Queueing */}
        {!batchResult ? (
          <>
            <div>
              <p className="text-xs text-slate-500">
                Upload multiple DealerSocket PDF reports together. Each file is analyzed, mapped,
                date-stamped with its service coverage period, and committed into individual reports.
              </p>
            </div>

            {errorMessage && (
              <div className="p-3 rounded-md bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Campaign Name selector */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Active Dealership
                </label>
                <div className="font-semibold text-slate-900 bg-white px-2.5 py-1.5 rounded border border-slate-200">
                  {activeDealership?.name || 'South Morang Hyundai'}
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Campaign Label
                </label>
                <input
                  type="text"
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                  placeholder="e.g. HY Closed RO"
                  className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded bg-white font-medium"
                />
              </div>
            </div>

            {/* Drag & Drop Multi-file Area */}
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                handleFileSelect(e.dataTransfer.files);
              }}
              className="border-2 border-dashed border-blue-300 hover:border-blue-500 bg-blue-50/40 hover:bg-blue-50/70 rounded-xl p-6 text-center cursor-pointer transition-colors"
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.csv,.xlsx,.xls"
                onChange={(e) => handleFileSelect(e.target.files)}
                className="hidden"
              />
              <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mx-auto mb-2">
                <UploadCloud className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-800">
                Drop multiple PDF files here, or browse
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Select 2, 5, 10 or more reports simultaneously · Supports PDF, CSV, XLSX (Up to 30MB each)
              </p>
              <span className="inline-block mt-3 text-xs font-semibold text-blue-600 bg-white border border-blue-200 px-3 py-1 rounded-full shadow-2xs">
                Select Multiple Files
              </span>
            </div>

            {/* Queued Files List with Scroller */}
            {filesQueue.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700">
                    Files Queued for Batch Ingestion ({filesQueue.length})
                  </span>
                  <button
                    onClick={() => setFilesQueue([])}
                    className="text-rose-600 hover:underline text-[11px]"
                  >
                    Clear All
                  </button>
                </div>

                <div className="max-h-56 overflow-auto border border-slate-200 rounded-lg divide-y divide-slate-100 bg-white">
                  {filesQueue.map((item, idx) => {
                    const isPdf = item.file.name.toLowerCase().endsWith('.pdf');
                    return (
                      <div
                        key={item.id}
                        className="px-3 py-2 flex items-center justify-between hover:bg-slate-50 text-xs"
                      >
                        <div className="flex items-center gap-2.5 truncate pr-2">
                          <span className="text-[11px] font-mono text-slate-400 w-5">
                            #{idx + 1}
                          </span>
                          {isPdf ? (
                            <FileText className="w-4 h-4 text-rose-500 shrink-0" />
                          ) : (
                            <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
                          )}
                          <div className="truncate">
                            <span className="font-medium text-slate-800 block truncate">
                              {item.file.name}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {formatFileSize(item.file.size)}
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={() => handleRemoveFile(item.id)}
                          disabled={isProcessing}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded"
                          title="Remove from batch"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Processing Indicator */}
            {isProcessing && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-3 text-xs text-blue-800 animate-pulse">
                <Loader2 className="w-5 h-5 text-blue-600 animate-spin shrink-0" />
                <div>
                  <div className="font-semibold">Processing Multi-PDF Batch...</div>
                  <div className="text-[11px] text-blue-600">{progressText}</div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <Button variant="outline" size="sm" onClick={handleModalClose} disabled={isProcessing}>
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleProcessAll}
                disabled={filesQueue.length === 0 || isProcessing}
                isLoading={isProcessing}
                icon={<Layers className="w-4 h-4" />}
              >
                Process All {filesQueue.length > 0 ? `(${filesQueue.length})` : ''} Reports Together
              </Button>
            </div>
          </>
        ) : (
          /* Step 2: Ingestion Results Summary */
          <div className="space-y-4">
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-900 flex items-start gap-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-emerald-900">
                  Successfully Ingested {batchResult.successful.length} Reports
                </h4>
                <p className="text-xs text-emerald-700 mt-0.5">
                  Extracted and preserved {batchResult.totalRecordsIngested.toLocaleString()} operational records across all uploaded documents.
                </p>
              </div>
            </div>

            {/* Report cards with distinct dates */}
            <div>
              <span className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Generated Reports by Service Date Period:
              </span>

              <div className="max-h-72 overflow-auto border border-slate-200 rounded-lg divide-y divide-slate-100 bg-white">
                {batchResult.successful.map((rep) => (
                  <div key={rep.reportId} className="p-3 hover:bg-slate-50 flex items-center justify-between text-xs">
                    <div className="space-y-1 pr-3">
                      <div className="font-bold text-slate-900 flex items-center gap-2">
                        <span>{rep.name}</span>
                        <Badge variant="success" size="sm">
                          {rep.recordCount} records
                        </Badge>
                      </div>

                      {/* Prominent Visual Date Pill */}
                      <div className="flex items-center gap-2 text-[11px]">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                          <Calendar className="w-3 h-3 text-blue-600" />
                          {rep.dateRange ||
                            (rep.reportDateFrom && rep.reportDateTo
                              ? `${formatDate(rep.reportDateFrom)} - ${formatDate(rep.reportDateTo)}`
                              : 'Period Extracted')}
                        </span>
                        <span className="text-slate-400 font-mono">
                          Source: {rep.sourceFileName}
                        </span>
                      </div>
                    </div>

                    <Link href={`/reports/${rep.reportId}`} onClick={handleModalClose}>
                      <Button variant="outline" size="sm" className="h-7 px-2.5 text-xs">
                        View <ExternalLink className="w-3 h-3 ml-1" />
                      </Button>
                    </Link>
                  </div>
                ))}

                {batchResult.failed.map((fail, idx) => (
                  <div key={idx} className="p-3 bg-rose-50/60 flex items-center justify-between text-xs">
                    <div className="text-rose-800">
                      <strong>{fail.fileName}</strong>: {fail.error}
                    </div>
                    <Badge variant="error" size="sm">Failed</Badge>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <Button variant="outline" size="sm" onClick={handleReset}>
                Upload Another Batch
              </Button>
              <Link href="/reports" onClick={handleModalClose}>
                <Button size="sm" icon={<ArrowRight className="w-3.5 h-3.5" />}>
                  Go to All Reports
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
