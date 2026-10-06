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

  // Create Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templateType, setTemplateType] = useState<'PDF' | 'SMS' | 'EMAIL' | 'VA_TASK'>('SMS');
  const [smsBody, setSmsBody] = useState('Hi {{customerName}}, your vehicle service for {{vehicleModel}} is complete!');
  const [emailSubject, setEmailSubject] = useState('Your Service Summary from South Morang Hyundai');
  const [emailBody, setEmailBody] = useState('Dear {{customerName}},\n\nThank you for choosing our service department.');
  const [isSaving, setIsSaving] = useState(false);

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

  const handleCreate = async () => {
    if (!activeDealership) return;
    setIsSaving(true);
    try {
      await api.post('/templates', {
        dealershipId: activeDealership._id,
        name: templateName,
        type: templateType,
        smsBody: templateType === 'SMS' ? smsBody : undefined,
        emailSubject: templateType === 'EMAIL' ? emailSubject : undefined,
        emailBody: templateType === 'EMAIL' ? emailBody : undefined,
      });
      setIsModalOpen(false);
      setTemplateName('');
      fetchTemplates();
    } catch (err) {
      console.error('Create template failed', err);
    } finally {
      setIsSaving(false);
    }
  };

  const filtered = templates.filter((t) => activeType === 'ALL' || t.type === activeType);

  const availableVariables = [
    '{{customerName}}',
    '{{firstName}}',
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
        <Button onClick={() => setIsModalOpen(true)} icon={<Plus className="w-4 h-4" />}>
          Create Template
        </Button>
      }
    >
      <div className="space-y-4">
        {/* Type Filter Buttons */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
          {(['ALL', 'PDF', 'SMS', 'EMAIL', 'VA_TASK'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setActiveType(type)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                activeType === type
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {type === 'ALL' ? 'All Templates' : type}
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
              <span key={v} className="px-2 py-0.5 rounded bg-white border border-slate-200 font-mono text-[11px] text-blue-600">
                {v}
              </span>
            ))}
          </div>
        </div>

        {/* Templates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((t) => (
            <div key={t._id} className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center justify-between">
                  <Badge variant={t.type === 'PDF' ? 'default' : t.type === 'SMS' ? 'success' : 'warning'}>
                    {t.type}
                  </Badge>
                  <span className="text-[11px] text-slate-400">{formatDate(t.createdAt)}</span>
                </div>
                <h3 className="text-sm font-semibold text-slate-900 mt-2">{t.name}</h3>
                <p className="text-xs text-slate-500 mt-1 line-clamp-3">
                  {t.smsBody || t.emailBody || t.pdfSettings?.reportTitle || 'Custom template configuration'}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400 font-mono">
                  {t.availableVariables?.length || 8} variables
                </span>
                <Button variant="outline" size="sm" className="h-7 text-xs">
                  Edit
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Create Template Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create New Template"
        description="Add a communication or report layout template"
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Template Name</label>
            <input
              type="text"
              required
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="e.g. Day 1 Post-Service SMS"
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded bg-white"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Channel / Type</label>
            <select
              value={templateType}
              onChange={(e) => setTemplateType(e.target.value as any)}
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded bg-white"
            >
              <option value="SMS">SMS Message</option>
              <option value="EMAIL">Email Follow-up</option>
              <option value="VA_TASK">Virtual Assistant Task</option>
              <option value="PDF">PDF Report Layout</option>
            </select>
          </div>

          {templateType === 'SMS' && (
            <div>
              <label className="block font-semibold text-slate-700 mb-1">SMS Message Body</label>
              <textarea
                rows={4}
                value={smsBody}
                onChange={(e) => setSmsBody(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded bg-white font-mono"
              />
            </div>
          )}

          {templateType === 'EMAIL' && (
            <div className="space-y-2">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Subject Line</label>
                <input
                  type="text"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded bg-white"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email Body Content</label>
                <textarea
                  rows={4}
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded bg-white font-mono"
                />
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" isLoading={isSaving} onClick={handleCreate}>
              Save Template
            </Button>
          </div>
        </div>
      </Modal>
    </AppLayout>
  );
}
