'use client';

import { useState } from 'react';
import { useTranslation } from '@/context/LanguageContext';
import { useCareRecipients, useUpdateCareRecipient, useDeleteCareRecipient } from '@/hooks/useAdminApi';
import { DataTable, UserModal, DeleteConfirmModal } from '@/components/admin';
import { CareRecipient } from '@/lib/api';
import { UserCheck } from 'lucide-react';

export default function CareRecipientsPage() {
  const { t } = useTranslation();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [pageSize, setPageSize] = useState(20);
  
  const [selectedCareRecipient, setSelectedCareRecipient] = useState<CareRecipient | null>(null);
  const [modalMode, setModalMode] = useState<'view' | 'edit'>('view');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // React Query hooks
  const { data, isLoading } = useCareRecipients(currentPage, searchQuery, pageSize);
  const updateMutation = useUpdateCareRecipient();
  const deleteMutation = useDeleteCareRecipient();

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  const handleView = (careRecipient: CareRecipient) => {
    setSelectedCareRecipient(careRecipient);
    setModalMode('view');
    setIsModalOpen(true);
  };

  const handleEdit = (careRecipient: CareRecipient) => {
    setSelectedCareRecipient(careRecipient);
    setModalMode('edit');
    setIsModalOpen(true);
  };

  const handleDelete = (careRecipient: CareRecipient) => {
    setSelectedCareRecipient(careRecipient);
    setIsDeleteModalOpen(true);
  };

  const handleSave = async (formData: Record<string, unknown>) => {
    if (!selectedCareRecipient) return;
    
    await updateMutation.mutateAsync({
      id: selectedCareRecipient.id,
      data: formData as Partial<CareRecipient>,
    });
    setIsModalOpen(false);
  };

  const handleConfirmDelete = async () => {
    if (!selectedCareRecipient) return;
    
    await deleteMutation.mutateAsync(selectedCareRecipient.id);
    setIsDeleteModalOpen(false);
  };

  const columns = [
    {
      key: 'name',
      label: t('admin.fields.name'),
      render: (item: CareRecipient) => (
        <div className="flex items-center gap-3">
          {item.profileImageUrl ? (
            <img src={item.profileImageUrl} alt="" className="w-8 h-8 rounded-full object-cover" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
              <span className="text-purple-700 font-medium text-xs">
                {item.firstName[0]}{item.lastName[0]}
              </span>
            </div>
          )}
          <span className="font-medium">{item.firstName} {item.lastName}</span>
        </div>
      ),
    },
    { key: 'email', label: t('admin.fields.email') },
    { key: 'city', label: t('admin.fields.city') },
    {
      key: 'subscriptionStatus',
      label: t('admin.fields.subscribed'),
      render: (item: CareRecipient) => {
        const status = item.subscriptionStatus || 'none';
        const colors: Record<string, string> = {
          active: 'bg-green-100 text-green-700',
          trial: 'bg-blue-100 text-blue-700',
          past_due: 'bg-yellow-100 text-yellow-700',
          canceled: 'bg-red-100 text-red-700',
          none: 'bg-gray-100 text-gray-600',
        };
        return (
          <span className={`px-2 py-1 text-xs rounded-full ${colors[status] || colors.none}`}>
            {t(`admin.status.subscription_${status}`)}
          </span>
        );
      },
    },
    {
      key: 'createdAt',
      label: t('admin.fields.createdAt'),
      render: (item: CareRecipient) => new Date(item.createdAt).toLocaleDateString('de-DE'),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <div className="p-3 bg-purple-50 rounded-xl">
          <UserCheck className="text-purple-600" size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('admin.careRecipients.title')}</h1>
          <p className="text-gray-500">{t('admin.careRecipients.subtitle')}</p>
        </div>
      </div>

      {/* Data table */}
      <DataTable
        columns={columns}
        data={data?.items || []}
        totalItems={data?.totalItems || 0}
        currentPage={data?.currentPage || 1}
        totalPages={data?.totalPages || 1}
        pageSize={pageSize}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        onSearch={handleSearch}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={handleDelete}
        isLoading={isLoading}
        searchPlaceholder={t('admin.careRecipients.searchPlaceholder')}
      />

      {/* Modals */}
      <UserModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        user={selectedCareRecipient}
        mode={modalMode}
        userType="careRecipient"
      />

      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        itemName={selectedCareRecipient ? `${selectedCareRecipient.firstName} ${selectedCareRecipient.lastName}` : ''}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
