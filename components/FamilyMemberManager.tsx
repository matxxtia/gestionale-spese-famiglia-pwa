'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import MotionWrapper, { AnimatePresenceWrapper } from './MotionWrapper'
import { Plus, Edit, Trash2, Key, Copy, Check, Users, Shield } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';

interface FamilyMember {
  id: string;
  name: string;
  role: string;
  sharePercentage: number;
  isActive: boolean;
  user: {
    username?: string;
  };
}

interface GeneratedCredentials {
  username: string;
  password: string;
  memberName: string;
}

interface FamilyMemberManagerProps {
  familyId: string;
}

export default function FamilyMemberManager({ familyId }: FamilyMemberManagerProps) {
  const { data: session } = useSession();
  const { t } = useTranslation();
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showCredentials, setShowCredentials] = useState<GeneratedCredentials | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [newMember, setNewMember] = useState({
    name: '',
    sharePercentage: 50
  });

  const isAdmin = session?.user?.role === 'admin';

  useEffect(() => {
    if (session?.user?.familyId) {
      fetchMembers();
    }
  }, [session]);

  const fetchMembers = async () => {
    try {
      const response = await fetch(`/api/family/${familyId}/members`);
      if (response.ok) {
        const data = await response.json();
        setMembers(data.members);
      }
    } catch (error) {
      console.error('Errore nel caricamento dei membri:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user?.familyId) return;

    try {
      const response = await fetch(`/api/family/${familyId}/members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newMember),
      });

      if (response.ok) {
        const data = await response.json();
        setShowCredentials({
          username: data.credentials.username,
          password: data.credentials.password,
          memberName: newMember.name
        });
        setNewMember({ name: '', sharePercentage: 50 });
        setShowAddForm(false);
        fetchMembers();
      }
    } catch (error) {
      console.error('Errore nell\'aggiunta del membro:', error);
    }
  };

  const handleDeleteMember = async (memberId: string) => {
    if (!confirm('Sei sicuro di voler eliminare questo membro?')) return;

    try {
      const response = await fetch(`/api/family/${familyId}/members/${memberId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchMembers();
      }
    } catch (error) {
      console.error('Errore nell\'eliminazione del membro:', error);
    }
  };

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (error) {
      console.error('Errore nella copia:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="w-6 h-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900">{t('family.members')}</h2>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            {t('family.addMember')}
          </button>
        )}
      </div>

      {/* Lista membri */}
      <div className="grid gap-4">
        {members.map((member) => (
          <MotionWrapper
            key={member.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg border border-gray-200 p-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  member.role === 'admin' ? 'bg-purple-100' : 'bg-blue-100'
                }`}>
                  {member.role === 'admin' ? (
                    <Shield className="w-5 h-5 text-purple-600" />
                  ) : (
                    <Users className="w-5 h-5 text-blue-600" />
                  )}
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">{member.name}</h3>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <span>{member.role === 'admin' ? t('family.admin') : t('family.member')}</span>
                    <span>•</span>
                    <span>{member.sharePercentage}%</span>
                    <span>•</span>
                    <span className={member.isActive ? 'text-green-600' : 'text-red-600'}>
                      {member.isActive ? t('family.active') : t('family.inactive')}
                    </span>
                  </div>
                  {member.user.username && (
                    <div className="text-xs text-gray-400 mt-1">
                      Username: {member.user.username}
                    </div>
                  )}
                </div>
              </div>
              
              {isAdmin && member.role !== 'admin' && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDeleteMember(member.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </MotionWrapper>
        ))}
      </div>

      {/* Form aggiunta membro */}
      <AnimatePresenceWrapper>
        {showAddForm && (
          <MotionWrapper
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          >
            <MotionWrapper
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-lg p-6 w-full max-w-md"
            >
              <h3 className="text-lg font-semibold mb-4">{t('family.addMember')}</h3>
              <form onSubmit={handleAddMember} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('family.memberName')}
                  </label>
                  <input
                    type="text"
                    value={newMember.name}
                    onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('family.splitPercentage')}
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={newMember.sharePercentage}
                    onChange={(e) => setNewMember({ ...newMember, sharePercentage: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    {t('common.add')}
                  </button>
                </div>
              </form>
            </MotionWrapper>
          </MotionWrapper>
        )}
      </AnimatePresenceWrapper>

      {/* Modal credenziali generate */}
      <AnimatePresenceWrapper>
        {showCredentials && (
          <MotionWrapper
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          >
            <MotionWrapper
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-lg p-6 w-full max-w-md"
            >
              <div className="text-center mb-6">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Key className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">{t('family.memberCredentials')}</h3>
                <p className="text-sm text-gray-600 mt-2">
                  {t('family.shareCredentials')}
                </p>
              </div>

              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-center mb-4">
                    <h4 className="font-medium text-gray-900">{showCredentials.memberName}</h4>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">
                        {t('auth.username')}
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={showCredentials.username}
                          readOnly
                          className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded text-sm"
                        />
                        <button
                          onClick={() => copyToClipboard(showCredentials.username, 'username')}
                          className="p-2 text-gray-500 hover:text-gray-700"
                        >
                          {copiedField === 'username' ? (
                            <Check className="w-4 h-4 text-green-600" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">
                        {t('auth.password')}
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={showCredentials.password}
                          readOnly
                          className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded text-sm font-mono"
                        />
                        <button
                          onClick={() => copyToClipboard(showCredentials.password, 'password')}
                          className="p-2 text-gray-500 hover:text-gray-700"
                        >
                          {copiedField === 'password' ? (
                            <Check className="w-4 h-4 text-green-600" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-center pt-6">
                <button
                  onClick={() => setShowCredentials(null)}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {t('common.close')}
                </button>
              </div>
            </MotionWrapper>
          </MotionWrapper>
        )}
      </AnimatePresenceWrapper>
    </div>
  );
}