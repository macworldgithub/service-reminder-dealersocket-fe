'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  UploadCloud,
  FileCheck2,
  Table,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  FileSpreadsheet,
  FileText,
  RotateCw,
  Eye,
  Info,
  Download,
  Layers,
  Check,
  X,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { BatchUploadModal } from '@/components/common/BatchUploadModal';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/authContext';
import { formatCurrency, formatFileSize, formatDate } from '@/lib/utils';

export default function NewImportPage() {
  const router = useRouter();
  const { activeDealership } = useAuth();
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);

  // Wizard state
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isCommitting, setIsCommitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Analysis result
  const [analysisData, setAnalysisData] = useState<any>(null);

  // Editable mappings
  const [mappings, setMappings] = useState<any[]>([]);

  // Preview data
  const [previewRows, setPreviewRows] = useState<any[]>([]);
  const [validationErrors, setValidationErrors] = useState<any[]>([]);

  // Final committed report
  const [commitResult, setCommitResult] = useState<any>(null);

  // Metadata overrides
  const [reportName, setReportName] = useState('');
  const [campaignName, setCampaignName] = useState('');
  const [isNewVersion, setIsNewVersion] = useState(false);

  // Step 1: File selection
  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  // Step 2: Upload & Analyze
  const handleAnalyze = async () => {
    if (!file || !activeDealership) return;
    setIsUploading(true);
    setErrorMessage('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('dealershipId', activeDealership._id);

      const res = await api.post('/imports/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data?.success && res.data.data) {
        const data = res.data.data;
        setAnalysisData(data);
        setMappings(data.suggestedMappings || []);
        setReportName(data.detectedMetadata?.dealershipName || file.name.replace(/\.[^/.]+$/, ''));
        setCampaignName(data.detectedMetadata?.campaignName || 'HY Closed RO');
        setCurrentStep(2);
      }
    } catch (err: any) {
      setErrorMessage(
        err.response?.data?.message || 'File analysis failed. Please verify format.'
      );
    } finally {
      setIsUploading(false);
    }
  };

  // Step 3 -> 4: Generate Preview
  const handleGeneratePreview = async () => {
    if (!analysisData) return;
    setIsUploading(true);
    setErrorMessage('');

    try {
      const previewRowsPayload =
        analysisData.sampleRows && analysisData.sampleRows.length > 0
          ? analysisData.sampleRows
          : (analysisData.allRows || []).slice(0, 100);

      const res = await api.post(`/imports/${analysisData.importId}/preview`, {
        rawRows: previewRowsPayload,
        mappings,
        limit: 50,
      });

      if (res.data?.success && res.data.data) {
        setPreviewRows(res.data.data.previewRows || []);
        setValidationErrors(res.data.data.validationErrors || []);
        setCurrentStep(4);
      }
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'Failed to generate preview.');
    } finally {
      setIsUploading(false);
    }
  };

  // Step 4 -> 5: Commit Import
  const handleCommitImport = async () => {
    if (!analysisData || !activeDealership) return;
    setIsCommitting(true);
    setErrorMessage('');

    try {
      const res = await api.post(`/imports/${analysisData.importId}/commit`, {
        dealershipId: activeDealership._id,
        reportName: reportName || file?.name || 'Ingested Report',
        campaignName: campaignName || 'HY Closed RO',
        reportDateFrom: analysisData.detectedMetadata?.reportDateFrom,
        reportDateTo: analysisData.detectedMetadata?.reportDateTo,
        rawRows: analysisData.allRows,
        columnMappings: mappings,
        isNewVersion,
      });

      if (res.data?.success && res.data.data) {
        setCommitResult(res.data.data);
        setCurrentStep(5);
      }
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'Failed to commit report records.');
    } finally {
      setIsCommitting(false);
    }
  };

  return (
    <AppLayout
      title="Report Ingestion Wizard"
      subtitle="Multi-step automated DealerSocket report parser and validator"
      breadcrumbs={[
        { label: 'Reports', href: '/reports' },
        { label: 'New Import' },
      ]}
    >
      <div className="max-w-5xl mx-auto">
        {/* Step Indicator Header */}
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs mb-6">
          <div className="grid grid-cols-5 gap-2 text-center text-xs">
            {[
              { num: 1, label: 'Upload' },
              { num: 2, label: 'Analyze' },
              { num: 3, label: 'Column Mapping' },
              { num: 4, label: 'Preview' },
              { num: 5, label: 'Import' },
            ].map((step) => (
              <div
                key={step.num}
                className={`py-2 px-3 rounded-md font-medium border flex items-center justify-center gap-2 transition-colors ${
                  currentStep === step.num
                    ? 'bg-blue-50 border-blue-300 text-blue-700'
                    : currentStep > step.num
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                    : 'bg-slate-50 border-slate-200 text-slate-400'
                }`}
              >
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    currentStep === step.num
                      ? 'bg-blue-600 text-white'
                      : currentStep > step.num
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {currentStep > step.num ? <Check className="w-3 h-3 stroke-[2.5]" /> : step.num}
                </span>
                <span>{step.label}</span>
              </div>
            ))}
          </div>
        </div>

        {errorMessage && (
          <div className="mb-6 p-4 rounded-lg bg-rose-50 border border-rose-200 text-sm text-rose-700 font-medium flex items-center justify-between">
            <span>{errorMessage}</span>
            <button
              onClick={() => setErrorMessage('')}
              className="p-1 rounded-md text-rose-500 hover:text-rose-700 hover:bg-rose-100 transition-colors cursor-pointer"
              title="Dismiss error"
            >
              <X className="w-4 h-4" strokeWidth={2} />
            </button>
          </div>
        )}

        {/* STEP 1: UPLOAD */}
        {currentStep === 1 && (
          <div className="bg-white p-8 rounded-lg border border-slate-200 shadow-xs space-y-6">
            {/* Multi-PDF Batch Ingestion Banner */}
            <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-lg flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-md bg-blue-600 text-white flex items-center justify-center shrink-0">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-blue-900">Have multiple PDF reports?</h4>
                  <p className="text-[11px] text-blue-700">
                    Process multiple PDF files together in a single batch with automatic date detection and naming.
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsBatchModalOpen(true)}
                icon={<Layers className="w-3.5 h-3.5 text-blue-600" />}
                className="bg-white hover:bg-blue-50 text-blue-700 border-blue-300 shrink-0"
              >
                Batch Upload PDFs
              </Button>
            </div>

            <div className="text-center max-w-lg mx-auto">
              <h2 className="text-base font-semibold text-slate-900">Upload Single Report (Step-by-Step Wizard)</h2>
              <p className="text-xs text-slate-500 mt-1">
                Select your closed repair orders or campaign report in CSV, XLSX, XLS, or PDF format.
              </p>
            </div>

            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleFileDrop}
              className={`border-2 border-dashed rounded-xl p-10 text-center transition-colors ${
                file ? 'border-blue-400 bg-blue-50/30' : 'border-slate-300 hover:border-slate-400 bg-slate-50/50'
              }`}
            >
              <UploadCloud className="w-12 h-12 mx-auto text-blue-600 mb-3" />
              <div className="text-sm font-medium text-slate-800">
                {file ? file.name : 'Drag & drop DealerSocket report here'}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {file ? `${formatFileSize(file.size)} · Ready to analyze` : 'Supports PDF, CSV, and Excel (up to 25MB)'}
              </p>

              <div className="mt-5 flex items-center justify-center gap-3">
                <label className="cursor-pointer">
                  <span className="inline-flex items-center justify-center px-4 py-2 text-xs font-semibold rounded-md bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 shadow-xs">
                    Browse Files
                  </span>
                  <input
                    type="file"
                    accept=".csv,.xlsx,.xls,.pdf"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
                {file && (
                  <Button variant="ghost" size="sm" onClick={() => setFile(null)}>
                    Remove
                  </Button>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100">
              <Button
                disabled={!file}
                isLoading={isUploading}
                onClick={handleAnalyze}
                icon={<ArrowRight className="w-4 h-4" />}
              >
                Analyze Report
              </Button>
            </div>
          </div>
        )}

        {/* STEP 2: ANALYZE SUMMARY */}
        {currentStep === 2 && analysisData && (
          <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-xs space-y-6">
            <div>
              <h2 className="text-base font-semibold text-slate-900">Analysis Results</h2>
              <p className="text-xs text-slate-500">
                Automated structure detection for {analysisData.fileName}
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-200">
              <div>
                <span className="text-[11px] text-slate-500 font-medium uppercase">Detected Records</span>
                <div className="text-lg font-bold text-slate-900">{analysisData.totalRows}</div>
              </div>
              <div>
                <span className="text-[11px] text-slate-500 font-medium uppercase">Detected Columns</span>
                <div className="text-lg font-bold text-slate-900">{analysisData.detectedHeaders?.length}</div>
              </div>
              <div>
                <span className="text-[11px] text-slate-500 font-medium uppercase">File Type</span>
                <div className="text-lg font-bold text-slate-900 uppercase font-mono">{analysisData.fileType}</div>
              </div>
              <div>
                <span className="text-[11px] text-slate-500 font-medium uppercase">Confidence</span>
                <div>
                  <Badge variant={analysisData.parseConfidence === 'high' ? 'success' : 'warning'}>
                    {analysisData.parseConfidence?.toUpperCase()}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Metadata Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Report Name
                </label>
                <input
                  type="text"
                  value={reportName}
                  onChange={(e) => setReportName(e.target.value)}
                  className="w-full text-sm px-3 py-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500 bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Campaign Name
                </label>
                <input
                  type="text"
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                  className="w-full text-sm px-3 py-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500 bg-white"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <Button variant="outline" onClick={() => setCurrentStep(1)} icon={<ArrowLeft className="w-4 h-4" />}>
                Back
              </Button>
              <Button onClick={() => setCurrentStep(3)} icon={<ArrowRight className="w-4 h-4" />}>
                Configure Column Mappings
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3: COLUMN MAPPING */}
        {currentStep === 3 && analysisData && (
          <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-xs space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-slate-900">Map DealerSocket Columns</h2>
                <p className="text-xs text-slate-500">
                  Match extracted DealerSocket columns to internal data schema. Unknown columns will be preserved in custom fields.
                </p>
              </div>
              <Badge variant="default">{mappings.length} Columns Detected</Badge>
            </div>

            <div className="border border-slate-200 rounded-lg overflow-auto max-h-[480px]">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="sticky top-0 bg-slate-50 z-10 border-b border-slate-200 shadow-xs">
                  <tr className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-700 text-[11px] uppercase tracking-wider">
                    <th className="py-2.5 px-4">DealerSocket Column</th>
                    <th className="py-2.5 px-4">Internal Target Field</th>
                    <th className="py-2.5 px-4">Data Type</th>
                    <th className="py-2.5 px-4">Transformation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {mappings.map((m, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80">
                      <td className="py-2.5 px-4 font-semibold text-slate-900">
                        {m.sourceColumn}
                      </td>
                      <td className="py-2.5 px-4">
                        <select
                          value={m.targetField}
                          onChange={(e) => {
                            const updated = [...mappings];
                            updated[idx].targetField = e.target.value;
                            setMappings(updated);
                          }}
                          className="w-full text-xs py-1.5 px-2 border border-slate-300 rounded bg-white font-medium"
                        >
                          <option value="externalEntityId">Entity ID</option>
                          <option value="customerName">Customer Name</option>
                          <option value="vehicle.year">Vehicle Year</option>
                          <option value="vehicle.make">Vehicle Make</option>
                          <option value="vehicle.model">Vehicle Model / Make-Model</option>
                          <option value="campaignName">Campaign Name</option>
                          <option value="campaignInsertDate">Campaign Insert Date</option>
                          <option value="eventNumber">Event Number</option>
                          <option value="closeDate">Close Date</option>
                          <option value="roAmount">RO Amount</option>
                          <option value="nOrU">N/U Status</option>
                          <option value={`custom_${m.sourceColumn}`}>Keep as Custom Field</option>
                        </select>
                      </td>
                      <td className="py-2.5 px-4">
                        <select
                          value={m.dataType}
                          onChange={(e) => {
                            const updated = [...mappings];
                            updated[idx].dataType = e.target.value;
                            setMappings(updated);
                          }}
                          className="text-xs py-1.5 px-2 border border-slate-300 rounded bg-white"
                        >
                          <option value="string">String</option>
                          <option value="number">Number</option>
                          <option value="currency">Currency</option>
                          <option value="date">Date</option>
                          <option value="boolean">Boolean</option>
                        </select>
                      </td>
                      <td className="py-2.5 px-4">
                        <select
                          value={m.transformation || 'none'}
                          onChange={(e) => {
                            const updated = [...mappings];
                            updated[idx].transformation = e.target.value;
                            setMappings(updated);
                          }}
                          className="text-xs py-1.5 px-2 border border-slate-300 rounded bg-white text-slate-600"
                        >
                          <option value="none">None</option>
                          <option value="trim">Trim Whitespace</option>
                          <option value="uppercase">Uppercase</option>
                          <option value="lowercase">Lowercase</option>
                          <option value="parse_currency">Parse Currency ($)</option>
                          <option value="parse_date">Parse Date</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <Button variant="outline" onClick={() => setCurrentStep(2)} icon={<ArrowLeft className="w-4 h-4" />}>
                Back
              </Button>
              <Button onClick={handleGeneratePreview} isLoading={isUploading} icon={<ArrowRight className="w-4 h-4" />}>
                Review &amp; Preview Records
              </Button>
            </div>
          </div>
        )}

        {/* STEP 4: PREVIEW RECORDS */}
        {currentStep === 4 && (
          <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-xs space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-slate-900">Preview Extracted Records</h2>
                <p className="text-xs text-slate-500">
                  First 50 records after mapping and validation transforms
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="success">{previewRows.length} Records Previewed</Badge>
                {validationErrors.length > 0 && (
                  <Badge variant="warning">{validationErrors.length} Validation Notices</Badge>
                )}
              </div>
            </div>

            <div className="border border-slate-200 rounded-lg overflow-auto max-h-[480px]">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="sticky top-0 bg-slate-100 z-10 border-b border-slate-200 shadow-xs">
                  <tr className="text-[11px] font-semibold text-slate-700 uppercase tracking-wider">
                    <th className="py-2.5 px-3">#</th>
                    <th className="py-2.5 px-3">Entity ID</th>
                    <th className="py-2.5 px-3">Customer Name</th>
                    <th className="py-2.5 px-3">N/U</th>
                    <th className="py-2.5 px-3">Year</th>
                    <th className="py-2.5 px-3">Make/Model</th>
                    <th className="py-2.5 px-3">Campaign Insert</th>
                    <th className="py-2.5 px-3">Event#</th>
                    <th className="py-2.5 px-3">Close Date</th>
                    <th className="py-2.5 px-3">RO Amount</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {previewRows.map((r, i) => (
                    <tr key={i} className="hover:bg-slate-50/80">
                      <td className="py-2 px-3 text-slate-400 font-mono text-[11px]">{i + 1}</td>
                      <td className="py-2 px-3 font-semibold text-slate-900 font-mono">
                        {r.externalEntityId || '—'}
                      </td>
                      <td className="py-2 px-3 text-slate-800">{r.customerName || '—'}</td>
                      <td className="py-2 px-3 text-slate-600 font-mono">{r.nOrU || '—'}</td>
                      <td className="py-2 px-3 text-slate-600 font-mono">{r.vehicle?.year || '—'}</td>
                      <td className="py-2 px-3 text-slate-600">
                        {[r.vehicle?.make, r.vehicle?.model].filter(Boolean).join(' ') || '—'}
                      </td>
                      <td className="py-2 px-3 text-slate-600">
                        {r.campaignInsertDate ? formatDate(r.campaignInsertDate) : '—'}
                      </td>
                      <td className="py-2 px-3 text-slate-600 font-mono">{r.eventNumber || '—'}</td>
                      <td className="py-2 px-3 text-slate-600">
                        {r.closeDate ? formatDate(r.closeDate) : '—'}
                      </td>
                      <td className="py-2 px-3 font-semibold text-slate-900">
                        {r.roAmount !== undefined ? formatCurrency(r.roAmount) : '—'}
                      </td>
                      <td className="py-2 px-3">
                        <Badge variant={r.recordStatus === 'VALID' ? 'success' : 'warning'} size="sm">
                          {r.recordStatus}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <Button variant="outline" onClick={() => setCurrentStep(3)} icon={<ArrowLeft className="w-4 h-4" />}>
                Back to Mapping
              </Button>
              <Button onClick={handleCommitImport} isLoading={isCommitting} icon={<CheckCircle2 className="w-4 h-4" />}>
                Commit &amp; Import Report
              </Button>
            </div>
          </div>
        )}

        {/* STEP 5: COMPLETION */}
        {currentStep === 5 && commitResult && (
          <div className="bg-white p-10 rounded-lg border border-slate-200 shadow-xs text-center space-y-6">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-900">Import Completed Successfully</h2>
              <p className="text-sm text-slate-500 mt-1">
                Report <strong className="text-slate-800">{commitResult.reportName}</strong> and all records are saved to MongoDB.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-4 max-w-md mx-auto bg-slate-50 p-4 rounded-lg border border-slate-200">
              <div>
                <span className="text-[11px] text-slate-500 uppercase font-medium">Imported</span>
                <div className="text-xl font-bold text-emerald-600">{commitResult.successfulRows}</div>
              </div>
              <div>
                <span className="text-[11px] text-slate-500 uppercase font-medium">Failed</span>
                <div className="text-xl font-bold text-slate-700">{commitResult.failedRows}</div>
              </div>
              <div>
                <span className="text-[11px] text-slate-500 uppercase font-medium">Status</span>
                <div className="text-xl font-bold text-blue-600">Active</div>
              </div>
            </div>

            <div className="flex items-center justify-center gap-3 pt-4">
              <Link href={`/reports/${commitResult.reportId}`}>
                <Button icon={<Eye className="w-4 h-4" />}>
                  View Ingested Report
                </Button>
              </Link>
              <Button
                variant="outline"
                onClick={() => {
                  setFile(null);
                  setAnalysisData(null);
                  setCurrentStep(1);
                }}
                icon={<RotateCw className="w-4 h-4" />}
              >
                Upload Another Report
              </Button>
            </div>
          </div>
        )}
      </div>

      <BatchUploadModal
        isOpen={isBatchModalOpen}
        onClose={() => setIsBatchModalOpen(false)}
        onSuccess={() => router.push('/reports')}
      />
    </AppLayout>
  );
}
