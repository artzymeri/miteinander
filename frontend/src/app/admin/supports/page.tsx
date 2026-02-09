'use client';

import { useState } from 'react';
import { useTranslation } from '@/context/LanguageContext';
import { useSupports, useCreateSupport, useUpdateSupport, useDeleteSupport } from '@/hooks/useAdminApi';
import { DataTable, UserModal, DeleteConfirmModal, AddSupportModal } from '@/components/admin';
import { Support, SupportFormData } from '@/lib/api';
import { Headphones, UserPlus } from 'lucide-react';

export default function SupportsPage() {
  const { t } = useTranslation();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [pageSize, setPageSize] = useState(20);
  
  const [selectedSupport, setSelectedSupport] = useState<Support | null>(null);
  const [modalMode, setModalMode] = useState<'view' | 'edit'>('view');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // React Query hooks
  const { data, isLoading } = useSupports(currentPage, searchQuery, pageSize);
  const createMutation = useCreateSupport();
  const updateMutation = useUpdateSupport();
  const deleteMutation = useDeleteSupport();

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

  const handleView = (support: Support) => {
    setSelectedSupport(support);
    setModalMode('view');
    setIsModalOpen(true);
  };

  const handleEdit = (support: Support) => {
    setSelectedSupport(support);
    setModalMode('edit');
    setIsModalOpen(true);
  };

  const handleDelete = (support: Support) => {
    setSelectedSupport(support);
    setIsDeleteModalOpen(true);
  };

  const handleSave = async (formData: Record<string, unknown>) => {
    if (!selectedSupport) return;
    
    await updateMutation.mutateAsync({
      id: selectedSupport.id,
      data: formData as Partial<Support>,
    });
    setIsModalOpen(false);
  };

  const handleCreate = async (formData: SupportFormData) => {
    await createMutation.mutateAsync(formData);
    setIsAddModalOpen(false);
  };

  const handleConfirmDelete = async () => {
    if (!selectedSupport) return;
    
    await deleteMutation.mutateAsync(selectedSupport.id);
    setIsDeleteModalOpen(false);
  };

  const columns = [
    {
      key: 'name',
      label: t('admin.fields.name'),
      render: (item: Support) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
            <span className="text-amber-700 font-medium text-xs">
              {item.firstName[0]}{item.lastName[0]}
            </span>
          </div>
          <span className="font-medium">{item.firstName} {item.lastName}</span>
        </div>
      ),
    },
    { key: 'email', label: t('admin.fields.email') },
    { key: 'phone', label: t('admin.fields.phone') },
    {
      key: 'isActive',
      label: t('admin.fields.status'),
      render: (item: Support) => (
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
      render: (item: Support) => new Date(item.createdAt).toLocaleDateString('de-DE'),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-50 rounded-xl">
            <Headphones className="text-amber-600" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('admin.supports.title')}</h1>
            <p className="text-gray-500">{t('admin.supports.subtitle')}</p>
          </div>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors cursor-pointer shadow-sm"
        >
          <UserPlus size={18} />
          <span className="hidden sm:inline">{t('admin.addSupport.button')}</span>
        </button>
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
        searchPlaceholder={t('admin.supports.searchPlaceholder')}
      />

      {/* Modals */}
      <UserModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        user={selectedSupport}
        mode={modalMode}
        userType="support"
      />

      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        itemName={selectedSupport ? `${selectedSupport.firstName} ${selectedSupport.lastName}` : ''}
        isLoading={deleteMutation.isPending}
      />

      <AddSupportModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleCreate}
        isLoading={createMutation.isPending}
      />
    </div>
  );
}
