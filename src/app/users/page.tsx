'use client';

import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Shield, Mail, CheckCircle2, Lock, Edit2 } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { Modal } from '@/components/common/Modal';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/authContext';
import { User } from '@/lib/types';
import { formatDate } from '@/lib/utils';

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Add User modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role] = useState<'ADMIN'>('ADMIN');
  const [isSaving, setIsSaving] = useState(false);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/users');
      if (res.data?.success) {
        setUsers(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load users', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser?.role === 'ADMIN') {
      fetchUsers();
    }
  }, [currentUser]);

  const handleCreateUser = async () => {
    setIsSaving(true);
    try {
      await api.post('/users', { name, email, password, role });
      setIsModalOpen(false);
      setName('');
      setEmail('');
      setPassword('');
      fetchUsers();
    } catch (err) {
      console.error('Failed to create user', err);
    } finally {
      setIsSaving(false);
    }
  };

  if (currentUser?.role !== 'ADMIN') {
    return (
      <AppLayout title="Access Denied">
        <div className="p-8 text-center text-xs text-rose-600 bg-white rounded-lg border border-slate-200">
          Administrator permissions required to view user management.
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout
      title="User Management"
      subtitle="Role-based access control and operator assignments"
      actions={
        <Button onClick={() => setIsModalOpen(true)} icon={<UserPlus className="w-4 h-4" />}>
          Invite User
        </Button>
      }
    >
      <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold uppercase text-[11px]">
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Last Login</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u) => (
                <tr key={u.id || (u as any)._id} className="hover:bg-slate-50/70">
                  <td className="py-3 px-4 font-semibold text-slate-900">{u.name}</td>
                  <td className="py-3 px-4 text-slate-600">{u.email}</td>
                  <td className="py-3 px-4">
                    <Badge variant={u.role === 'ADMIN' ? 'default' : u.role === 'MANAGER' ? 'success' : 'neutral'}>
                      {u.role}
                    </Badge>
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center gap-1 text-emerald-600 font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Active
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-400">
                    {u.lastLoginAt ? formatDate(u.lastLoginAt) : 'Never'}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Button variant="outline" size="sm" className="h-7 text-xs">
                      Edit
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invite User Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add New User"
        description="Create account credentials with assigned role permissions"
      >
        <div className="space-y-3 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Full Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Michael Chen"
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded bg-white"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="michael@dealership.com"
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded bg-white"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Temporary Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded bg-white"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Role Permission</label>
            <div className="w-full text-xs px-3 py-2 border border-slate-200 rounded bg-slate-50 text-slate-700 font-medium flex items-center justify-between">
              <span>Administrator (Full platform &amp; operations access)</span>
              <Badge variant="default" size="sm">ADMIN</Badge>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" isLoading={isSaving} onClick={handleCreateUser}>
              Create User
            </Button>
          </div>
        </div>
      </Modal>
    </AppLayout>
  );
}
