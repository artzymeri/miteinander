'use client';

import { useState } from 'react';
import { useTranslation } from '@/context/LanguageContext';
import { useCareGivers, useUpdateCareGiver, useDeleteCareGiver } from '@/hooks/useAdminApi';
import { DataTable, UserModal, DeleteConfirmModal } from '@/components/admin';
import { CareGiver } from '@/lib/api';
import { HeartHandshake } from 'lucide-react';

export default function CareGiversPage() {
  const { t } = useTranslation();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [pageSize, setPageSize] = useState(20);
  
  const [selectedCareGiver, setSelectedCareGiver] = useState<CareGiver | null>(null);
  const [modalMode, setModalMode] = useState<'view' | 'edit'>('view');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // React Query hooks
  const { data, isLoading } = useCareGivers(currentPage, searchQuery, pageSize);
  const updateMutation = useUpdateCareGiver();
  const deleteMutation = useDeleteCareGiver();

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

  const handleView = (careGiver: CareGiver) => {
    setSelectedCareGiver(careGiver);
    setModalMode('view');
    setIsModalOpen(true);
  };

  const handleEdit = (careGiver: CareGiver) => {
    setSelectedCareGiver(careGiver);
    setModalMode('edit');
    setIsModalOpen(true);
  };

  const handleDelete = (careGiver: CareGiver) => {
    setSelectedCareGiver(careGiver);
    setIsDeleteModalOpen(true);
  };

  const handleSave = async (formData: Record<string, unknown>) => {
    if (!selectedCareGiver) return;
    
    await updateMutation.mutateAsync({
      id: selectedCareGiver.id,
      data: formData as Partial<CareGiver>,
    });
    setIsModalOpen(false);
  };

  const handleConfirmDelete = async () => {
    if (!selectedCareGiver) return;
    
    await deleteMutation.mutateAsync(selectedCareGiver.id);
    setIsDeleteModalOpen(false);
  };

  const columns = [
    {
      key: 'name',
      label: t('admin.fields.name'),
      render: (item: CareGiver) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
            <span className="text-green-700 font-medium text-xs">
              {item.firstName[0]}{item.lastName[0]}
            </span>
          </div>
          <span className="font-medium">{item.firstName} {item.lastName}</span>
        </div>
      ),
    },
    { key: 'email', label: t('admin.fields.email') },
    { key: 'city', label: t('admin.fields.city') },
    {
      key: 'isVerified',
      label: t('admin.fields.verified'),
      render: (item: CareGiver) => (
        <span className={`px-2 py-1 text-xs rounded-full ${
          item.isVerified ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
        }`}>
          {item.isVerified ? t('admin.status.verified') : t('admin.status.pending')}
        </span>
      ),
    },
    {
      key: 'isActive',
      label: t('admin.fields.status'),
      render: (item: CareGiver) => (
        <span className={`px-2 py-1 text-xs rounded-full ${
          item.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
        }`}>
          {item.isActive ? t('admin.status.active') : t('admin.status.inactive')}
        </span>
      ),
    },
    {
      key: 'createdAt',
      label: t('admin.fields.createdAt'),
      render: (item: CareGiver) => new Date(item.createdAt).toLocaleDateString('de-DE'),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <div className="p-3 bg-green-50 rounded-xl">
          <HeartHandshake className="text-green-600" size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('admin.careGivers.title')}</h1>
          <p className="text-gray-500">{t('admin.careGivers.subtitle')}</p>
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
        searchPlaceholder={t('admin.careGivers.searchPlaceholder')}
      />

      {/* Modals */}
      <UserModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        user={selectedCareGiver}
        mode={modalMode}
        userType="careGiver"
      />

      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        itemName={selectedCareGiver ? `${selectedCareGiver.firstName} ${selectedCareGiver.lastName}` : ''}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
