'use client';

import React, { useState, useEffect } from 'react';
import {
  FileText,
  MessageSquare,
  Mail,
  CheckSquare,
  Plus,
  Edit2,
  Trash2,
  Code2,
  Sparkles,
  Check,
  AlertCircle,
  Palette,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { Modal } from '@/components/common/Modal';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/authContext';
import { TemplateItem } from '@/lib/types';
import { formatDate } from '@/lib/utils';

export default function TemplatesPage() {
  const { activeDealership } = useAuth();
  const [templates, setTemplates] = useState<TemplateItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeType, setActiveType] = useState<'ALL' | 'PDF' | 'SMS' | 'EMAIL' | 'VA_TASK'>('ALL');

  // Modal state (used for both Create & Edit)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<TemplateItem | null>(null);

  // Form state
  const [templateName, setTemplateName] = useState('');
  const [templateType, setTemplateType] = useState<'PDF' | 'SMS' | 'EMAIL' | 'VA_TASK'>('SMS');
  const [smsBody, setSmsBody] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [vaTaskDescription, setVaTaskDescription] = useState('');

  // PDF Template Settings state
  const [pdfReportTitle, setPdfReportTitle] = useState('Campaign Summary');
  const [pdfSubtitle, setPdfSubtitle] = useState('Service Detail');
  const [pdfHeaderDealership, setPdfHeaderDealership] = useState('South Morang Hyundai');
  const [pdfCampaignLabel, setPdfCampaignLabel] = useState('HY Closed RO');
  const [pdfPrimaryColor, setPdfPrimaryColor] = useState('#0f172a');
  const [pdfFooterNotes, setPdfFooterNotes] = useState('DealerSocket Operations Management System - Confidential');

  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchTemplates = async () => {
    setIsLoading(true);
    try {
      const param = activeDealership ? `?dealershipId=${activeDealership._id}` : '';
      const res = await api.get(`/templates${param}`);
      if (res.data?.success) {
        setTemplates(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load templates', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, [activeDealership]);

  const handleOpenCreateModal = () => {
    setEditingTemplate(null);
    setTemplateName('');
    setTemplateType('SMS');
    setSmsBody('Hi {{customerName}}, your vehicle service for {{vehicleModel}} with South Morang Hyundai is complete! Your RO amount was {{roAmount}}.');
    setEmailSubject('Your Service Summary from South Morang Hyundai');
    setEmailBody('Dear {{customerName}},\n\nThank you for choosing South Morang Hyundai. Your vehicle service for {{vehicleYear}} {{vehicleModel}} has been completed successfully.');
    setVaTaskDescription('Follow up with customer regarding warranty service.');
    setPdfReportTitle('Campaign Summary');
    setPdfSubtitle('Service Detail');
    setPdfHeaderDealership(activeDealership?.name || 'South Morang Hyundai');
    setPdfCampaignLabel('HY Closed RO');
    setPdfPrimaryColor('#0f172a');
    setPdfFooterNotes('DealerSocket Operations Management System - Confidential');
    setIsModalOpen(true);
  };

  const handleStartEdit = (t: TemplateItem) => {
    setEditingTemplate(t);
    setTemplateName(t.name);
    setTemplateType(t.type);
    setSmsBody(t.smsBody || '');
    setEmailSubject(t.emailSubject || '');
    setEmailBody(t.emailBody || '');
    setVaTaskDescription(t.vaTaskDescription || '');

    if (t.pdfSettings) {
      setPdfReportTitle(t.pdfSettings.reportTitle || 'Campaign Summary');
      setPdfSubtitle(t.pdfSettings.subtitle || 'Service Detail');
      setPdfHeaderDealership(t.pdfSettings.headerDealershipName || activeDealership?.name || 'South Morang Hyundai');
      setPdfCampaignLabel(t.pdfSettings.campaignLabel || 'HY Closed RO');
      setPdfPrimaryColor(t.pdfSettings.primaryColor || '#0f172a');
      setPdfFooterNotes(t.pdfSettings.footerNotes || 'DealerSocket Operations Management System - Confidential');
    } else {
      setPdfReportTitle('Campaign Summary');
      setPdfSubtitle('Service Detail');
      setPdfHeaderDealership(activeDealership?.name || 'South Morang Hyundai');
      setPdfCampaignLabel('HY Closed RO');
      setPdfPrimaryColor('#0f172a');
      setPdfFooterNotes('DealerSocket Operations Management System - Confidential');
    }

    setIsModalOpen(true);
  };

  const handleDelete = async (t: TemplateItem, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Are you sure you want to delete template "${t.name}"?`)) return;

    setDeletingId(t._id);
    try {
      await api.delete(`/templates/${t._id}`);
      setTemplates((prev) => prev.filter((item) => item._id !== t._id));
    } catch (err) {
      console.error('Delete template failed', err);
      alert('Failed to delete template');
    } finally {
      setDeletingId(null);
    }
  };

  const handleSave = async () => {
    if (!templateName.trim()) {
      alert('Please enter a template name');
      return;
    }

    setIsSaving(true);
    try {
      const payload: any = {
        name: templateName.trim(),
        type: templateType,
      };

      if (templateType === 'SMS') {
        payload.smsBody = smsBody;
      } else if (templateType === 'EMAIL') {
        payload.emailSubject = emailSubject;
        payload.emailBody = emailBody;
      } else if (templateType === 'VA_TASK') {
        payload.vaTaskDescription = vaTaskDescription;
      } else if (templateType === 'PDF') {
        payload.pdfSettings = {
          reportTitle: pdfReportTitle,
          subtitle: pdfSubtitle,
          headerDealershipName: pdfHeaderDealership,
          campaignLabel: pdfCampaignLabel,
          primaryColor: pdfPrimaryColor,
          footerNotes: pdfFooterNotes,
          columns: editingTemplate?.pdfSettings?.columns || [
            { field: 'externalEntityId', label: 'Entity ID', visible: true },
            { field: 'customerName', label: 'Customer Name', visible: true },
            { field: 'customerEmail', label: 'Email', visible: true },
            { field: 'vehicle.year', label: 'Year', visible: true },
            { field: 'vehicle.model', label: 'Make/Model', visible: true },
            { field: 'campaignName', label: 'Campaign', visible: true },
            { field: 'closeDate', label: 'Close Date', visible: true },
            { field: 'roAmount', label: 'RO Amount', visible: true },
          ],
        };
      }

      if (editingTemplate) {
        // Edit existing
        const res = await api.patch(`/templates/${editingTemplate._id}`, payload);
        if (res.data?.success && res.data.data) {
          setTemplates((prev) =>
            prev.map((item) => (item._id === editingTemplate._id ? res.data.data : item))
          );
        } else {
          await fetchTemplates();
        }
      } else {
        // Create new
        payload.dealershipId = activeDealership?._id;
        const res = await api.post('/templates', payload);
        if (res.data?.success && res.data.data) {
          setTemplates((prev) => [res.data.data, ...prev]);
        } else {
          await fetchTemplates();
        }
      }

      setIsModalOpen(false);
      setEditingTemplate(null);
    } catch (err) {
      console.error('Save template failed', err);
      alert('Failed to save template');
    } finally {
      setIsSaving(false);
    }
  };

  const insertVariable = (variable: string) => {
    if (templateType === 'SMS') {
      setSmsBody((prev) => prev + ` ${variable}`);
    } else if (templateType === 'EMAIL') {
      setEmailBody((prev) => prev + ` ${variable}`);
    } else if (templateType === 'VA_TASK') {
      setVaTaskDescription((prev) => prev + ` ${variable}`);
    }
  };

  const filtered = templates.filter((t) => activeType === 'ALL' || t.type === activeType);

  const availableVariables = [
    '{{customerName}}',
    '{{firstName}}',
    '{{customerEmail}}',
    '{{vehicleYear}}',
    '{{vehicleMake}}',
    '{{vehicleModel}}',
    '{{roAmount}}',
    '{{closeDate}}',
    '{{eventNumber}}',
    '{{entityId}}',
  ];

  return (
    <AppLayout
      title="Communication &amp; PDF Templates"
      subtitle="Manage document layouts, customer SMS reminders, emails, and VA tasks"
      actions={
        <Button onClick={handleOpenCreateModal} icon={<Plus className="w-4 h-4" strokeWidth={2} />}>
          Create Template
        </Button>
      }
    >
      <div className="space-y-4">
        {/* Type Filter Buttons */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
          {[
            { id: 'ALL', label: 'All Communication Templates', icon: <Sparkles className="w-3.5 h-3.5" strokeWidth={1.75} /> },
            { id: 'SMS', label: 'SMS Messages', icon: <MessageSquare className="w-3.5 h-3.5" strokeWidth={1.75} /> },
            { id: 'EMAIL', label: 'Email Reminders', icon: <Mail className="w-3.5 h-3.5" strokeWidth={1.75} /> },
            { id: 'VA_TASK', label: 'VA Tasks', icon: <CheckSquare className="w-3.5 h-3.5" strokeWidth={1.75} /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveType(tab.id as any)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                activeType === tab.id
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Variables banner */}
        <div className="bg-slate-100/70 p-3.5 rounded-lg border border-slate-200 text-xs">
          <div className="font-semibold text-slate-700 flex items-center gap-1.5 mb-1.5">
            <Code2 className="w-3.5 h-3.5 text-blue-600" />
            <span>Supported Dynamic Template Variables:</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {availableVariables.map((v) => (
              <span
                key={v}
                onClick={() => insertVariable(v)}
                title="Click to copy or insert"
                className="px-2 py-0.5 rounded bg-white border border-slate-200 font-mono text-[11px] text-blue-600 hover:border-blue-400 cursor-pointer transition-colors"
              >
                {v}
              </span>
            ))}
          </div>
        </div>

        {/* Templates Grid */}
        {isLoading ? (
          <div className="py-16 text-center text-xs text-slate-400">Loading templates...</div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-lg border border-slate-200 p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 mx-auto flex items-center justify-center text-slate-400">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-slate-800">No {activeType !== 'ALL' ? activeType : ''} templates found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Create custom PDF document layouts, SMS follow-up templates, or email summaries for South Morang Hyundai.
            </p>
            <Button size="sm" onClick={handleOpenCreateModal} icon={<Plus className="w-3.5 h-3.5" />}>
              Create Template
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((t) => (
              <div
                key={t._id}
                className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs flex flex-col justify-between space-y-3 hover:border-slate-300 transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <Badge
                      variant={
                        t.type === 'PDF'
                          ? 'default'
                          : t.type === 'SMS'
                          ? 'success'
                          : t.type === 'EMAIL'
                          ? 'neutral'
                          : 'warning'
                      }
                    >
                      {t.type}
                    </Badge>
                    <span className="text-[11px] text-slate-400">{formatDate(t.createdAt)}</span>
                  </div>
                  <h3 className="text-sm font-semibold text-slate-900 mt-2 truncate" title={t.name}>
                    {t.name}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-3">
                    {t.smsBody ||
                      t.emailBody ||
                      t.vaTaskDescription ||
                      t.pdfSettings?.reportTitle ||
                      'Custom template configuration'}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400 font-mono">
                    {t.type === 'PDF'
                      ? `${t.pdfSettings?.columns?.filter((c) => c.visible !== false).length || 8} columns`
                      : `${t.availableVariables?.length || 8} variables`}
                  </span>

                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleStartEdit(t)}
                      icon={<Edit2 className="w-3 h-3 text-slate-600" />}
                      className="h-7 text-xs px-2.5"
                    >
                      Edit
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => handleDelete(t, e)}
                      isLoading={deletingId === t._id}
                      icon={<Trash2 className="w-3 h-3 text-rose-600" />}
                      className="h-7 text-xs px-2 hover:bg-rose-50 hover:border-rose-300"
                      title="Delete Template"
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create / Edit Template Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingTemplate(null);
        }}
        title={editingTemplate ? `Edit Template: ${editingTemplate.name}` : 'Create New Template'}
        description={
          editingTemplate
            ? `Modify ${editingTemplate.type} template layout and parameters`
            : 'Add a communication or report layout template'
        }
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Template Name</label>
            <input
              type="text"
              required
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="e.g. South Morang Closed RO Follow-Up"
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded bg-white focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Channel / Type</label>
            <select
              value={templateType}
              disabled={!!editingTemplate}
              onChange={(e) => setTemplateType(e.target.value as any)}
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded bg-white disabled:bg-slate-100 disabled:text-slate-500"
            >
              <option value="SMS">SMS Message</option>
              <option value="EMAIL">Email Follow-up</option>
              <option value="VA_TASK">Virtual Assistant Task</option>
              <option value="PDF">PDF Report Layout</option>
            </select>
            {editingTemplate && (
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                Template type cannot be changed after creation.
              </span>
            )}
          </div>

          {/* SMS Editor */}
          {templateType === 'SMS' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block font-semibold text-slate-700">SMS Message Body</label>
                <span className="text-[11px] text-slate-400">{smsBody.length} characters</span>
              </div>
              <textarea
                rows={4}
                value={smsBody}
                onChange={(e) => setSmsBody(e.target.value)}
                placeholder="Hi {{customerName}}, your vehicle service is complete!"
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded bg-white font-mono focus:ring-1 focus:ring-blue-500"
              />
              <div>
                <span className="block text-[11px] font-medium text-slate-500 mb-1">Quick-insert variable:</span>
                <div className="flex flex-wrap gap-1">
                  {availableVariables.slice(0, 6).map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => insertVariable(v)}
                      className="px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded text-[10px] font-mono text-blue-600"
                    >
                      + {v}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* EMAIL Editor */}
          {templateType === 'EMAIL' && (
            <div className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Subject Line</label>
                <input
                  type="text"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  placeholder="e.g. Service Summary from South Morang Hyundai"
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded bg-white focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email Body Content</label>
                <textarea
                  rows={5}
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                  placeholder="Dear {{customerName}},\n\nThank you for choosing South Morang Hyundai..."
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded bg-white font-mono focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <span className="block text-[11px] font-medium text-slate-500 mb-1">Quick-insert variable:</span>
                <div className="flex flex-wrap gap-1">
                  {availableVariables.map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => insertVariable(v)}
                      className="px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded text-[10px] font-mono text-blue-600"
                    >
                      + {v}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* VA TASK Editor */}
          {templateType === 'VA_TASK' && (
            <div className="space-y-2">
              <label className="block font-semibold text-slate-700 mb-1">Virtual Assistant Task Description</label>
              <textarea
                rows={4}
                value={vaTaskDescription}
                onChange={(e) => setVaTaskDescription(e.target.value)}
                placeholder="Call customer {{customerName}} at {{customerPhone}} to confirm vehicle collection..."
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded bg-white font-mono focus:ring-1 focus:ring-blue-500"
              />
            </div>
          )}

          {/* PDF Layout Editor */}
          {templateType === 'PDF' && (
            <div className="space-y-3 bg-slate-50 p-3 rounded-md border border-slate-200">
              <span className="block font-semibold text-slate-800 text-[11px] uppercase tracking-wider">
                PDF Document Settings
              </span>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-0.5">Report Title</label>
                  <input
                    type="text"
                    value={pdfReportTitle}
                    onChange={(e) => setPdfReportTitle(e.target.value)}
                    className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-0.5">Subtitle</label>
                  <input
                    type="text"
                    value={pdfSubtitle}
                    onChange={(e) => setPdfSubtitle(e.target.value)}
                    className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-0.5">Dealership Name</label>
                  <input
                    type="text"
                    value={pdfHeaderDealership}
                    onChange={(e) => setPdfHeaderDealership(e.target.value)}
                    className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-0.5">Campaign Label</label>
                  <input
                    type="text"
                    value={pdfCampaignLabel}
                    onChange={(e) => setPdfCampaignLabel(e.target.value)}
                    className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-0.5">Accent Theme Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={pdfPrimaryColor}
                    onChange={(e) => setPdfPrimaryColor(e.target.value)}
                    className="w-7 h-7 rounded border border-slate-300 cursor-pointer p-0.5 bg-white"
                  />
                  <span className="font-mono text-slate-600 text-xs">{pdfPrimaryColor}</span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-0.5">Footer Notes</label>
                <input
                  type="text"
                  value={pdfFooterNotes}
                  onChange={(e) => setPdfFooterNotes(e.target.value)}
                  className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded bg-white"
                />
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setIsModalOpen(false);
                setEditingTemplate(null);
              }}
            >
              Cancel
            </Button>
            <Button size="sm" isLoading={isSaving} onClick={handleSave}>
              {editingTemplate ? 'Save Changes' : 'Create Template'}
            </Button>
          </div>
        </div>
      </Modal>
    </AppLayout>
  );
}
