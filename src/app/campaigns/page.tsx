'use client';

import React, { useState, useEffect } from 'react';
import {
  Workflow,
  MessageSquare,
  Mail,
  PhoneCall,
  Clock,
  ArrowRight,
  Plus,
  Play,
  CheckCircle2,
  Sparkles,
  Info,
  RefreshCw,
  Trash2,
  Settings,
  Pause,
  AlertCircle,
  Search,
  Filter,
  Calendar,
  Users,
  Send,
  Check,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { Modal } from '@/components/common/Modal';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/authContext';

interface CampaignStep {
  stepNumber: number;
  channel: 'SMS' | 'EMAIL' | 'VA_TASK';
  delayDays: number;
  description: string;
}

interface Campaign {
  _id: string;
  name: string;
  description?: string;
  triggerType: 'CLOSED_RO' | 'SERVICE_DUE' | 'MANUAL';
  status: 'ACTIVE' | 'PAUSED' | 'DRAFT' | 'ARCHIVED';
  steps: CampaignStep[];
  dealershipId?: string;
  createdAt?: string;
}

interface ReportOption {
  _id: string;
  name: string;
  campaignName?: string;
  recordCount?: number;
  totalRecords?: number;
  createdAt?: string;
}

interface DispatchItem {
  id: string;
  recordId: string;
  entityId: string;
  customerName: string;
  phone: string;
  email: string;
  vehicle: string;
  roNumber: string;
  roAmount: string;
  stepNumber: number;
  stepDescription: string;
  channel: 'SMS' | 'EMAIL' | 'VA_TASK';
  delayDays: number;
  scheduledDate: string;
  status: string;
  preview: string;
}

interface ExecutionResult {
  campaign: {
    _id: string;
    name: string;
    triggerType: string;
    status: string;
  };
  report: {
    _id: string;
    name: string;
    campaignName?: string;
    totalRecords: number;
  };
  executionSummary: {
    totalRecipients: number;
    totalSteps: number;
    totalDispatchesScheduled: number;
    channelCounts: {
      sms: number;
      email: number;
      vaTask: number;
    };
    executedAt: string;
  };
  dispatches: DispatchItem[];
}

export default function CampaignsPage() {
  const { activeDealership } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [reports, setReports] = useState<ReportOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Execution State
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>('');
  const [selectedReportId, setSelectedReportId] = useState<string>('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState<ExecutionResult | null>(null);
  const [executionError, setExecutionError] = useState<string | null>(null);
  const [channelFilter, setChannelFilter] = useState<'ALL' | 'SMS' | 'EMAIL' | 'VA_TASK'>('ALL');
  const [dispatchSearch, setDispatchSearch] = useState('');

  // Create Campaign Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSubmittingCreate, setIsSubmittingCreate] = useState(false);
  const [newCampaignName, setNewCampaignName] = useState('');
  const [newCampaignDescription, setNewCampaignDescription] = useState('');
  const [newCampaignTrigger, setNewCampaignTrigger] = useState<'CLOSED_RO' | 'SERVICE_DUE' | 'MANUAL'>('CLOSED_RO');
  const [newCampaignSteps, setNewCampaignSteps] = useState<CampaignStep[]>([
    { stepNumber: 1, channel: 'SMS', delayDays: 1, description: 'Day 1 Post-Service Satisfaction Check' },
    { stepNumber: 2, channel: 'EMAIL', delayDays: 3, description: 'Day 3 Inspection Report & Survey Link' },
    { stepNumber: 3, channel: 'SMS', delayDays: 7, description: 'Day 7 Complimentary Car Wash Reminder' },
    { stepNumber: 4, channel: 'VA_TASK', delayDays: 12, description: 'Day 12 Virtual Assistant Concierge Call' },
  ]);

  // Configure Steps Modal State
  const [isConfigureModalOpen, setIsConfigureModalOpen] = useState(false);
  const [isSubmittingConfig, setIsSubmittingConfig] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [editingSteps, setEditingSteps] = useState<CampaignStep[]>([]);
  const [editingName, setEditingName] = useState('');
  const [editingDescription, setEditingDescription] = useState('');
  const [editingStatus, setEditingStatus] = useState<'ACTIVE' | 'PAUSED'>('ACTIVE');

  // Delete State
  const [campaignToDelete, setCampaignToDelete] = useState<Campaign | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Success Feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Fetch campaigns and reports
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const dParam = activeDealership ? `?dealershipId=${activeDealership._id}` : '';
      const [campRes, repRes] = await Promise.all([
        api.get(`/campaigns${dParam}`),
        api.get(`/reports${dParam}`),
      ]);

      if (campRes.data?.success) {
        const cList: Campaign[] = campRes.data.data || [];
        setCampaigns(cList);
        if (cList.length > 0 && !selectedCampaignId) {
          setSelectedCampaignId(cList[0]._id);
        }
      }

      if (repRes.data?.success) {
        const rList: ReportOption[] = repRes.data.data || [];
        setReports(rList);
        if (rList.length > 0 && !selectedReportId) {
          setSelectedReportId(rList[0]._id);
        }
      }
    } catch (err) {
      console.error('Failed to load campaigns/reports', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeDealership]);

  // Execute Campaign Flow
  const handleExecuteCampaign = async (campaignIdToRun?: string, reportIdToRun?: string) => {
    const cId = campaignIdToRun || selectedCampaignId;
    const rId = reportIdToRun || selectedReportId;

    if (!cId) {
      setExecutionError('Please select a campaign flow to execute.');
      return;
    }

    setIsExecuting(true);
    setExecutionError(null);
    try {
      const res = await api.post(`/campaigns/${cId}/execute`, {
        reportId: rId || undefined,
      });

      if (res.data?.success) {
        setExecutionResult(res.data.data);
        showToast(`Successfully executed campaign flow across ${res.data.data.executionSummary?.totalRecipients?.toLocaleString()} records!`);
      } else {
        setExecutionError(res.data?.message || 'Campaign execution returned an error');
      }
    } catch (err: any) {
      console.error('Campaign execution failed', err);
      const errMsg = err.response?.data?.message || err.message || 'Failed to execute campaign engine';
      setExecutionError(errMsg);
    } finally {
      setIsExecuting(false);
    }
  };

  // Open Configure Steps Modal
  const openConfigureModal = (c: Campaign) => {
    setEditingCampaign(c);
    setEditingName(c.name);
    setEditingDescription(c.description || '');
    setEditingStatus(c.status === 'PAUSED' ? 'PAUSED' : 'ACTIVE');
    setEditingSteps(c.steps && c.steps.length > 0 ? JSON.parse(JSON.stringify(c.steps)) : [
      { stepNumber: 1, channel: 'SMS', delayDays: 1, description: 'Day 1 Post-Service Satisfaction Check' },
      { stepNumber: 2, channel: 'EMAIL', delayDays: 3, description: 'Day 3 Service Inspection Summary & Survey' },
      { stepNumber: 3, channel: 'SMS', delayDays: 7, description: 'Day 7 Complimentary Car Wash Reminder' },
      { stepNumber: 4, channel: 'VA_TASK', delayDays: 12, description: 'Day 12 Virtual Assistant Phone Follow-up' },
    ]);
    setIsConfigureModalOpen(true);
  };

  // Submit Step Configuration Update
  const handleSaveStepConfig = async () => {
    if (!editingCampaign) return;
    setIsSubmittingConfig(true);
    try {
      // Re-number steps
      const formattedSteps = editingSteps.map((s, idx) => ({
        ...s,
        stepNumber: idx + 1,
        delayDays: Number(s.delayDays) || 0,
      }));

      const res = await api.patch(`/campaigns/${editingCampaign._id}`, {
        name: editingName,
        description: editingDescription,
        status: editingStatus,
        steps: formattedSteps,
      });

      if (res.data?.success) {
        showToast('Campaign steps updated successfully!');
        setIsConfigureModalOpen(false);
        fetchData();
      }
    } catch (err: any) {
      console.error('Failed to update campaign', err);
      alert(err.response?.data?.message || 'Failed to update campaign');
    } finally {
      setIsSubmittingConfig(false);
    }
  };

  // Toggle Status (Active / Paused)
  const handleToggleStatus = async (c: Campaign) => {
    const nextStatus = c.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
    try {
      const res = await api.patch(`/campaigns/${c._id}`, { status: nextStatus });
      if (res.data?.success) {
        showToast(`Campaign is now ${nextStatus.toLowerCase()}`);
        fetchData();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update status');
    }
  };

  // Create New Campaign
  const handleCreateCampaign = async () => {
    if (!newCampaignName.trim()) {
      alert('Please enter a campaign name');
      return;
    }

    setIsSubmittingCreate(true);
    try {
      const payload = {
        dealershipId: activeDealership?._id,
        name: newCampaignName.trim(),
        description: newCampaignDescription.trim(),
        triggerType: newCampaignTrigger,
        status: 'ACTIVE',
        steps: newCampaignSteps.map((s, idx) => ({
          ...s,
          stepNumber: idx + 1,
          delayDays: Number(s.delayDays) || 0,
        })),
      };

      const res = await api.post('/campaigns', payload);
      if (res.data?.success) {
        showToast('New Campaign Flow created successfully!');
        setIsCreateModalOpen(false);
        setNewCampaignName('');
        setNewCampaignDescription('');
        fetchData();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to create campaign flow');
    } finally {
      setIsSubmittingCreate(false);
    }
  };

  // Delete Campaign
  const handleDeleteCampaign = async () => {
    if (!campaignToDelete) return;
    setIsDeleting(true);
    try {
      const res = await api.delete(`/campaigns/${campaignToDelete._id}`);
      if (res.data?.success) {
        showToast('Campaign flow deleted');
        setCampaignToDelete(null);
        fetchData();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete campaign');
    } finally {
      setIsDeleting(false);
    }
  };

  // Add Step to Editing
  const addStepToEditing = () => {
    setEditingSteps([
      ...editingSteps,
      {
        stepNumber: editingSteps.length + 1,
        channel: 'SMS',
        delayDays: (editingSteps[editingSteps.length - 1]?.delayDays || 0) + 3,
        description: 'New Follow-Up Step',
      },
    ]);
  };

  // Remove Step from Editing
  const removeStepFromEditing = (index: number) => {
    if (editingSteps.length <= 1) {
      alert('A campaign sequence must have at least 1 step.');
      return;
    }
    const updated = editingSteps.filter((_, i) => i !== index);
    setEditingSteps(updated);
  };

  // Filtered Dispatches
  const filteredDispatches = (executionResult?.dispatches || []).filter((d) => {
    const matchesChannel = channelFilter === 'ALL' || d.channel === channelFilter;
    const query = dispatchSearch.toLowerCase().trim();
    const matchesSearch =
      !query ||
      d.customerName?.toLowerCase().includes(query) ||
      d.vehicle?.toLowerCase().includes(query) ||
      d.roNumber?.toLowerCase().includes(query) ||
      d.entityId?.toLowerCase().includes(query) ||
      d.phone?.includes(query);
    return matchesChannel && matchesSearch;
  });

  return (
    <AppLayout
      title="Automated Campaign Architecture"
      subtitle="Section 20 decoupled campaign automation fed by DealerSocket Closed RO reports"
      actions={
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
            icon={<RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />}
          >
            Refresh
          </Button>
          <Button
            size="sm"
            onClick={() => setIsCreateModalOpen(true)}
            icon={<Plus className="w-4 h-4" />}
          >
            New Campaign Flow
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Toast Alert */}
        {toastMessage && (
          <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 bg-emerald-600 text-white px-4 py-3 rounded-lg shadow-lg text-xs font-semibold animate-in slide-in-from-bottom duration-200">
            <Check className="w-4 h-4" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* ========================================================================= */}
        {/* CAMPAIGN ENGINE LIVE RUNNER & DISPATCH CONTROLLER                         */}
        {/* ========================================================================= */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-xl p-5 text-white shadow-md border border-slate-800">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="flex h-2.5 w-2.5 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                <span className="text-xs font-bold tracking-wider uppercase text-emerald-400">
                  Campaign Engine Ready
                </span>
              </div>
              <h2 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                <Workflow className="w-5 h-5 text-indigo-400" />
                Live Campaign Execution & Dispatch Engine
              </h2>
              <p className="text-xs text-slate-300 mt-1">
                Trigger end-to-end nurture journeys across all customer records ingested from DealerSocket Closed RO reports.
              </p>
            </div>

            {/* Quick Trigger Controls */}
            <div className="flex flex-wrap items-center gap-2.5 bg-white/10 p-2.5 rounded-lg border border-white/10 backdrop-blur-xs">
              <div className="flex flex-col gap-1 min-w-[170px]">
                <label className="text-[10px] uppercase font-bold text-slate-300 tracking-wider">
                  Target Flow
                </label>
                <select
                  value={selectedCampaignId}
                  onChange={(e) => setSelectedCampaignId(e.target.value)}
                  className="bg-slate-800 text-white border border-slate-700 rounded px-2.5 py-1.5 text-xs font-medium focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                >
                  {campaigns.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name} ({c.status})
                    </option>
                  ))}
                  {campaigns.length === 0 && <option value="">No campaigns available</option>}
                </select>
              </div>

              <div className="flex flex-col gap-1 min-w-[200px]">
                <label className="text-[10px] uppercase font-bold text-slate-300 tracking-wider">
                  Source Ingested Report
                </label>
                <select
                  value={selectedReportId}
                  onChange={(e) => setSelectedReportId(e.target.value)}
                  className="bg-slate-800 text-white border border-slate-700 rounded px-2.5 py-1.5 text-xs font-medium focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                >
                  {reports.map((r) => (
                    <option key={r._id} value={r._id}>
                      {r.name} ({((r.recordCount ?? r.totalRecords) || 0).toLocaleString()} recs)
                    </option>
                  ))}
                  {reports.length === 0 && <option value="">No reports available</option>}
                </select>
              </div>

              <div className="flex flex-col justify-end pt-3 sm:pt-0">
                <button
                  onClick={() => handleExecuteCampaign()}
                  disabled={isExecuting || campaigns.length === 0}
                  className="inline-flex items-center justify-center gap-2 bg-indigo-500 hover:bg-indigo-600 disabled:bg-slate-700 text-white px-4 py-2 rounded font-semibold text-xs transition-all shadow-sm active:scale-98 cursor-pointer disabled:cursor-not-allowed"
                >
                  {isExecuting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Executing Flow...</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-white" />
                      <span>Run & Dispatch Flow</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Execution Error Banner */}
          {executionError && (
            <div className="bg-rose-950/80 border border-rose-800 p-3 rounded-lg text-xs text-rose-200 flex items-center gap-2 mt-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{executionError}</span>
            </div>
          )}

          {/* Live Execution Results Summary */}
          {executionResult && (
            <div className="mt-4 pt-4 border-t border-slate-800/80 space-y-4 animate-in fade-in duration-300">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="text-xs font-bold text-white">
                    Flow &ldquo;{executionResult.campaign?.name}&rdquo; successfully executed against report &ldquo;{executionResult.report?.name}&rdquo;
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 font-mono">
                  Dispatched at: {new Date(executionResult.executionSummary.executedAt).toLocaleTimeString()}
                </span>
              </div>

              {/* Stat Counters */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                <div className="bg-white/5 border border-white/10 rounded-lg p-2.5 text-center">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Total Recipients</span>
                  <span className="text-lg font-black text-white">
                    {executionResult.executionSummary.totalRecipients.toLocaleString()}
                  </span>
                </div>

                <div className="bg-indigo-950/60 border border-indigo-800/60 rounded-lg p-2.5 text-center">
                  <span className="text-[10px] text-indigo-300 uppercase font-semibold block">Total Dispatches</span>
                  <span className="text-lg font-black text-indigo-300">
                    {executionResult.executionSummary.totalDispatchesScheduled.toLocaleString()}
                  </span>
                </div>

                <div className="bg-blue-950/50 border border-blue-800/50 rounded-lg p-2.5 text-center">
                  <span className="text-[10px] text-blue-300 uppercase font-semibold block flex items-center justify-center gap-1">
                    <MessageSquare className="w-3 h-3" /> SMS Dispatches
                  </span>
                  <span className="text-lg font-black text-blue-300">
                    {executionResult.executionSummary.channelCounts.sms.toLocaleString()}
                  </span>
                </div>

                <div className="bg-purple-950/50 border border-purple-800/50 rounded-lg p-2.5 text-center">
                  <span className="text-[10px] text-purple-300 uppercase font-semibold block flex items-center justify-center gap-1">
                    <Mail className="w-3 h-3" /> Email Dispatches
                  </span>
                  <span className="text-lg font-black text-purple-300">
                    {executionResult.executionSummary.channelCounts.email.toLocaleString()}
                  </span>
                </div>

                <div className="bg-emerald-950/50 border border-emerald-800/50 rounded-lg p-2.5 text-center">
                  <span className="text-[10px] text-emerald-300 uppercase font-semibold block flex items-center justify-center gap-1">
                    <PhoneCall className="w-3 h-3" /> VA Tasks
                  </span>
                  <span className="text-lg font-black text-emerald-300">
                    {executionResult.executionSummary.channelCounts.vaTask.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* REAL-TIME DISPATCH QUEUE & MESSAGE PREVIEW (SHOWS UP AFTER EXECUTION)     */}
        {/* ========================================================================= */}
        {executionResult && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Send className="w-4 h-4 text-indigo-600" />
                  Dispatches Queue & Personalized Message Stream
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Showing scheduled dispatches generated dynamically with DealerSocket customer and RO variables.
                </p>
              </div>

              {/* Filters & Search */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={dispatchSearch}
                    onChange={(e) => setDispatchSearch(e.target.value)}
                    placeholder="Search recipient, RO#, vehicle..."
                    className="pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-md focus:outline-hidden focus:ring-1 focus:ring-indigo-500 w-52"
                  />
                </div>

                <div className="flex items-center bg-slate-200 p-0.5 rounded-md text-xs">
                  <button
                    onClick={() => setChannelFilter('ALL')}
                    className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors ${
                      channelFilter === 'ALL' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    All ({executionResult.dispatches.length})
                  </button>
                  <button
                    onClick={() => setChannelFilter('SMS')}
                    className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors ${
                      channelFilter === 'SMS' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    SMS
                  </button>
                  <button
                    onClick={() => setChannelFilter('EMAIL')}
                    className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors ${
                      channelFilter === 'EMAIL' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Email
                  </button>
                  <button
                    onClick={() => setChannelFilter('VA_TASK')}
                    className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors ${
                      channelFilter === 'VA_TASK' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    VA Task
                  </button>
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto max-h-[420px] overflow-y-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-100/80 sticky top-0 z-10 border-b border-slate-200 text-slate-600 font-semibold text-[11px]">
                  <tr>
                    <th className="py-2.5 px-3">Customer / Entity</th>
                    <th className="py-2.5 px-3">Vehicle & RO</th>
                    <th className="py-2.5 px-3">Channel / Step</th>
                    <th className="py-2.5 px-3">Delay / Date</th>
                    <th className="py-2.5 px-3">Personalized Message Preview</th>
                    <th className="py-2.5 px-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredDispatches.slice(0, 50).map((d) => (
                    <tr key={d.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-slate-900">{d.customerName}</div>
                        <div className="text-[10px] text-slate-500 font-mono">Entity: {d.entityId}</div>
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <div className="font-medium text-slate-800">{d.vehicle}</div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          RO #{d.roNumber} • {d.roAmount}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          {d.channel === 'SMS' && (
                            <Badge variant="blue" size="sm" className="font-semibold">
                              <MessageSquare className="w-3 h-3 mr-1" /> SMS
                            </Badge>
                          )}
                          {d.channel === 'EMAIL' && (
                            <Badge variant="purple" size="sm" className="font-semibold">
                              <Mail className="w-3 h-3 mr-1" /> Email
                            </Badge>
                          )}
                          {d.channel === 'VA_TASK' && (
                            <Badge variant="success" size="sm" className="font-semibold">
                              <PhoneCall className="w-3 h-3 mr-1" /> VA Task
                            </Badge>
                          )}
                          <span className="text-[10px] text-slate-500">Step {d.stepNumber}</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <div className="font-medium text-slate-800">+{d.delayDays} Days</div>
                        <div className="text-[10px] text-slate-500 font-mono">{d.scheduledDate}</div>
                      </td>
                      <td className="py-2.5 px-3 max-w-md">
                        <div className="text-[11px] text-slate-700 bg-slate-50 p-1.5 rounded border border-slate-100 line-clamp-2">
                          {d.preview}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-right whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                          QUEUED
                        </span>
                      </td>
                    </tr>
                  ))}
                  {filteredDispatches.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        No dispatches found matching filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {filteredDispatches.length > 50 && (
              <div className="p-2.5 bg-slate-50 border-t border-slate-200 text-center text-[11px] text-slate-500">
                Displaying preview sample of 50 out of {filteredDispatches.length.toLocaleString()} queued dispatches.
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* ARCHITECTURE FLOW EXPLANATION BANNER                                      */}
        {/* ========================================================================= */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <h2 className="text-sm font-semibold text-slate-900">
              DealerSocket Report Ingestion → Automation Pipeline
            </h2>
          </div>
          <p className="text-xs text-slate-500 mb-4">
            Ingested reports retain immutable reference IDs (<code>dealershipId</code>, <code>reportId</code>, <code>recordId</code>, and <code>externalEntityId</code>) which directly trigger customer nurture journeys.
          </p>

          {/* Step Sequence Flow Diagram */}
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 text-xs">
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
              <span className="text-[10px] font-bold text-blue-600 uppercase">Trigger Event</span>
              <div className="font-semibold text-slate-900 mt-1">Closed RO Ingested</div>
              <p className="text-[11px] text-slate-500 mt-0.5">DealerSocket PDF/CSV ingested</p>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-md">
              <span className="text-[10px] font-bold text-slate-500 uppercase">Day 1 Channel</span>
              <div className="font-semibold text-slate-900 mt-1 flex items-center gap-1">
                <MessageSquare className="w-3.5 h-3.5 text-blue-600" /> SMS Follow-Up
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">Post-service thank you</p>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-md">
              <span className="text-[10px] font-bold text-slate-500 uppercase">Day 3 Channel</span>
              <div className="font-semibold text-slate-900 mt-1 flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-purple-600" /> Email Survey
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">Inspection breakdown</p>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-md">
              <span className="text-[10px] font-bold text-slate-500 uppercase">Day 7 Channel</span>
              <div className="font-semibold text-slate-900 mt-1 flex items-center gap-1">
                <MessageSquare className="w-3.5 h-3.5 text-blue-600" /> Car Wash SMS
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">Loyalty perk reminder</p>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-md">
              <span className="text-[10px] font-bold text-slate-500 uppercase">Day 12 Channel</span>
              <div className="font-semibold text-slate-900 mt-1 flex items-center gap-1">
                <PhoneCall className="w-3.5 h-3.5 text-emerald-600" /> VA Task Queue
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">Concierge phone call</p>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* EXISTING CAMPAIGNS LIST                                                   */}
        {/* ========================================================================= */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900">
              Active Campaign Sequences ({campaigns.length})
            </h3>
          </div>

          {isLoading ? (
            <div className="p-8 text-center text-slate-400 bg-white rounded-lg border border-slate-200">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-500" />
              <span>Loading campaign sequences...</span>
            </div>
          ) : campaigns.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-lg border border-slate-200 space-y-3">
              <Workflow className="w-8 h-8 text-slate-400 mx-auto" />
              <p className="text-sm font-semibold text-slate-700">No Campaign Flows Configured</p>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Create your first automated nurture flow triggered whenever DealerSocket Closed RO reports are uploaded.
              </p>
              <Button size="sm" onClick={() => setIsCreateModalOpen(true)} icon={<Plus className="w-4 h-4" />}>
                Create First Campaign Flow
              </Button>
            </div>
          ) : (
            campaigns.map((c) => (
              <div key={c._id} className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-slate-900">{c.name}</h4>
                      <Badge
                        variant={c.status === 'ACTIVE' ? 'success' : 'neutral'}
                        size="sm"
                      >
                        {c.status}
                      </Badge>
                      <Badge variant="blue" size="sm">
                        {c.triggerType}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{c.description || 'No description provided'}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleExecuteCampaign(c._id)}
                      disabled={isExecuting}
                      className="h-8 text-xs bg-indigo-600 hover:bg-indigo-700 text-white"
                      icon={<Play className="w-3.5 h-3.5 fill-white" />}
                    >
                      Run Engine
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openConfigureModal(c)}
                      className="h-8 text-xs"
                      icon={<Settings className="w-3.5 h-3.5" />}
                    >
                      Configure Steps
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleStatus(c)}
                      className="h-8 text-xs text-slate-600"
                    >
                      {c.status === 'ACTIVE' ? 'Pause' : 'Activate'}
                    </Button>

                    <button
                      onClick={() => setCampaignToDelete(c)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                      title="Delete Campaign Flow"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Step Sequence Timeline */}
                <div className="border border-slate-100 rounded-lg p-3 bg-slate-50/70 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider block">
                      Workflow Steps ({c.steps?.length || 0}):
                    </span>
                    <button
                      onClick={() => openConfigureModal(c)}
                      className="text-[11px] text-indigo-600 hover:underline font-medium"
                    >
                      Edit Timeline Steps →
                    </button>
                  </div>

                  <div className="space-y-2">
                    {c.steps?.map((step: any, idx: number) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between bg-white px-3 py-2 rounded border border-slate-200 text-xs"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-[10px]">
                            {step.stepNumber}
                          </span>
                          {step.channel === 'SMS' && (
                            <Badge variant="blue" size="sm">
                              <MessageSquare className="w-3 h-3 mr-1" /> SMS
                            </Badge>
                          )}
                          {step.channel === 'EMAIL' && (
                            <Badge variant="purple" size="sm">
                              <Mail className="w-3 h-3 mr-1" /> Email
                            </Badge>
                          )}
                          {step.channel === 'VA_TASK' && (
                            <Badge variant="success" size="sm">
                              <PhoneCall className="w-3 h-3 mr-1" /> VA Task
                            </Badge>
                          )}
                          <span className="font-medium text-slate-800">{step.description}</span>
                        </div>
                        <span className="text-[11px] text-slate-500 font-mono">
                          +{step.delayDays} Days
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* ========================================================================= */}
        {/* MODAL: NEW CAMPAIGN FLOW                                                  */}
        {/* ========================================================================= */}
        <Modal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          title="Create New Campaign Flow"
          description="Design an automated multi-channel sequence triggered upon report ingestion"
          maxWidth="2xl"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Campaign Flow Name *
              </label>
              <input
                type="text"
                value={newCampaignName}
                onChange={(e) => setNewCampaignName(e.target.value)}
                placeholder="e.g. 30-Day Service Retention Flow"
                className="w-full px-3 py-2 border border-slate-200 rounded-md text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Description
              </label>
              <input
                type="text"
                value={newCampaignDescription}
                onChange={(e) => setNewCampaignDescription(e.target.value)}
                placeholder="Brief summary of target customer audience and timing"
                className="w-full px-3 py-2 border border-slate-200 rounded-md text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Trigger Type
              </label>
              <select
                value={newCampaignTrigger}
                onChange={(e) => setNewCampaignTrigger(e.target.value as any)}
                className="w-full px-3 py-2 border border-slate-200 rounded-md text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-hidden bg-white"
              >
                <option value="CLOSED_RO">Closed RO Ingested (DealerSocket Import Trigger)</option>
                <option value="SERVICE_DUE">Service Due (Scheduled Mileage/Date Interval)</option>
                <option value="MANUAL">Manual Trigger Only</option>
              </select>
            </div>

            {/* Steps Editor */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-slate-700">
                  Sequence Steps ({newCampaignSteps.length})
                </label>
                <button
                  type="button"
                  onClick={() =>
                    setNewCampaignSteps([
                      ...newCampaignSteps,
                      {
                        stepNumber: newCampaignSteps.length + 1,
                        channel: 'SMS',
                        delayDays: (newCampaignSteps[newCampaignSteps.length - 1]?.delayDays || 0) + 4,
                        description: 'Follow-up touchpoint',
                      },
                    ])
                  }
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Step
                </button>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto">
                {newCampaignSteps.map((step, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded-md text-xs"
                  >
                    <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-[10px] shrink-0">
                      {idx + 1}
                    </span>

                    <select
                      value={step.channel}
                      onChange={(e) => {
                        const updated = [...newCampaignSteps];
                        updated[idx].channel = e.target.value as any;
                        setNewCampaignSteps(updated);
                      }}
                      className="px-2 py-1 bg-white border border-slate-200 rounded text-xs font-medium w-28 shrink-0"
                    >
                      <option value="SMS">SMS</option>
                      <option value="EMAIL">EMAIL</option>
                      <option value="VA_TASK">VA TASK</option>
                    </select>

                    <div className="flex items-center gap-1 shrink-0">
                      <span className="text-slate-500 text-[11px]">+</span>
                      <input
                        type="number"
                        min="0"
                        value={step.delayDays}
                        onChange={(e) => {
                          const updated = [...newCampaignSteps];
                          updated[idx].delayDays = parseInt(e.target.value) || 0;
                          setNewCampaignSteps(updated);
                        }}
                        className="w-12 px-1.5 py-1 bg-white border border-slate-200 rounded text-xs font-mono text-center"
                      />
                      <span className="text-slate-500 text-[11px]">Days</span>
                    </div>

                    <input
                      type="text"
                      value={step.description}
                      onChange={(e) => {
                        const updated = [...newCampaignSteps];
                        updated[idx].description = e.target.value;
                        setNewCampaignSteps(updated);
                      }}
                      placeholder="Step description or purpose"
                      className="flex-1 px-2 py-1 bg-white border border-slate-200 rounded text-xs"
                    />

                    <button
                      type="button"
                      onClick={() => {
                        if (newCampaignSteps.length <= 1) return;
                        setNewCampaignSteps(newCampaignSteps.filter((_, i) => i !== idx));
                      }}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsCreateModalOpen(false)}
                disabled={isSubmittingCreate}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleCreateCampaign}
                disabled={isSubmittingCreate}
                icon={<Check className="w-4 h-4" />}
              >
                {isSubmittingCreate ? 'Creating...' : 'Create Campaign Flow'}
              </Button>
            </div>
          </div>
        </Modal>

        {/* ========================================================================= */}
        {/* MODAL: CONFIGURE STEPS                                                    */}
        {/* ========================================================================= */}
        <Modal
          isOpen={isConfigureModalOpen}
          onClose={() => setIsConfigureModalOpen(false)}
          title={`Configure Steps: ${editingCampaign?.name || ''}`}
          description="Adjust sequence timing, message channels, and trigger intervals"
          maxWidth="2xl"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Flow Name
                </label>
                <input
                  type="text"
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-md text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Flow Status
                </label>
                <select
                  value={editingStatus}
                  onChange={(e) => setEditingStatus(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-md text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-hidden bg-white"
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="PAUSED">PAUSED</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Description
              </label>
              <input
                type="text"
                value={editingDescription}
                onChange={(e) => setEditingDescription(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-md text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>

            {/* Sequence Steps */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-slate-700">
                  Timeline Steps ({editingSteps.length})
                </label>
                <button
                  type="button"
                  onClick={addStepToEditing}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Step
                </button>
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto">
                {editingSteps.map((step, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded-md text-xs"
                  >
                    <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-[10px] shrink-0">
                      {idx + 1}
                    </span>

                    <select
                      value={step.channel}
                      onChange={(e) => {
                        const updated = [...editingSteps];
                        updated[idx].channel = e.target.value as any;
                        setEditingSteps(updated);
                      }}
                      className="px-2 py-1 bg-white border border-slate-200 rounded text-xs font-medium w-28 shrink-0"
                    >
                      <option value="SMS">SMS</option>
                      <option value="EMAIL">EMAIL</option>
                      <option value="VA_TASK">VA TASK</option>
                    </select>

                    <div className="flex items-center gap-1 shrink-0">
                      <span className="text-slate-500 text-[11px]">+</span>
                      <input
                        type="number"
                        min="0"
                        value={step.delayDays}
                        onChange={(e) => {
                          const updated = [...editingSteps];
                          updated[idx].delayDays = parseInt(e.target.value) || 0;
                          setEditingSteps(updated);
                        }}
                        className="w-12 px-1.5 py-1 bg-white border border-slate-200 rounded text-xs font-mono text-center"
                      />
                      <span className="text-slate-500 text-[11px]">Days</span>
                    </div>

                    <input
                      type="text"
                      value={step.description}
                      onChange={(e) => {
                        const updated = [...editingSteps];
                        updated[idx].description = e.target.value;
                        setEditingSteps(updated);
                      }}
                      className="flex-1 px-2 py-1 bg-white border border-slate-200 rounded text-xs"
                    />

                    <button
                      type="button"
                      onClick={() => removeStepFromEditing(idx)}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded"
                      title="Remove Step"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsConfigureModalOpen(false)}
                disabled={isSubmittingConfig}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSaveStepConfig}
                disabled={isSubmittingConfig}
                icon={<Check className="w-4 h-4" />}
              >
                {isSubmittingConfig ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </Modal>

        {/* ========================================================================= */}
        {/* MODAL: DELETE CONFIRMATION                                                */}
        {/* ========================================================================= */}
        <Modal
          isOpen={!!campaignToDelete}
          onClose={() => setCampaignToDelete(null)}
          title="Delete Campaign Flow"
          description="Are you sure you want to delete this campaign flow?"
          maxWidth="sm"
        >
          <div className="space-y-4">
            <p className="text-xs text-slate-600">
              This will permanently remove the sequence{' '}
              <strong className="text-slate-900">&ldquo;{campaignToDelete?.name}&rdquo;</strong>.
              Ingested records and past dispatch audit logs will not be affected.
            </p>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCampaignToDelete(null)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <button
                onClick={handleDeleteCampaign}
                disabled={isDeleting}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded text-xs font-semibold disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Delete Flow'}
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </AppLayout>
  );
}
