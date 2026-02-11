'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from '@/context/LanguageContext';
import {
  useCareNeeds,
  useCreateCareNeed,
  useUpdateCareNeed,
  useDeleteCareNeed,
} from '@/hooks/useAdminApi';
import { DeleteConfirmModal } from '@/components/admin';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import { CareNeed, CareNeedFormData } from '@/lib/api';
import {
  Settings,
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  GripVertical,
  Heart,
  Home,
  Pill,
  Car,
  Sparkles,
  ChefHat,
  Bath,
  Accessibility,
  // Additional icons for care needs
  Utensils,
  Shirt,
  Bed,
  Brain,
  Activity,
  Stethoscope,
  Syringe,
  Thermometer,
  Eye,
  Ear,
  HandHelping,
  Footprints,
  Clock,
  Calendar,
  Phone,
  MessageCircle,
  ShoppingCart,
  Briefcase,
  Book,
  Music,
  Palette,
  Gamepad2,
  Dog,
  Cat,
  Flower2,
  Sun,
  Moon,
  CloudSun,
  Umbrella,
  MapPin,
  Plane,
  Bus,
  Bike,
  Baby,
  Users,
  UserPlus,
  HeartPulse,
  Shield,
  Lock,
  Key,
  Smile,
  Frown,
  Meh,
  Coffee,
  Wine,
  Apple,
  Salad,
  Sandwich,
  Dumbbell,
  TreePine,
  Mountain,
  Waves,
} from 'lucide-react';

// Icon mapping for care needs - organized by category
const ICONS: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  // Daily Living
  Home,
  Bed,
  Bath,
  Utensils,
  ChefHat,
  Shirt,
  Coffee,
  // Health & Medical
  Heart,
  HeartPulse,
  Pill,
  Stethoscope,
  Syringe,
  Thermometer,
  Activity,
  Brain,
  // Senses
  Eye,
  Ear,
  Smile,
  Frown,
  Meh,
  // Mobility
  Car,
  Bus,
  Bike,
  Plane,
  Footprints,
  Accessibility,
  // Social & Communication
  Users,
  UserPlus,
  HandHelping,
  Phone,
  MessageCircle,
  // Time & Scheduling
  Clock,
  Calendar,
  Sun,
  Moon,
  CloudSun,
  // Activities & Hobbies
  Book,
  Music,
  Palette,
  Gamepad2,
  Dumbbell,
  // Outdoors & Nature
  TreePine,
  Mountain,
  Waves,
  Flower2,
  Umbrella,
  // Food & Nutrition
  Apple,
  Salad,
  Sandwich,
  Wine,
  // Pets
  Dog,
  Cat,
  // Shopping & Errands
  ShoppingCart,
  Briefcase,
  MapPin,
  // Care & Safety
  Baby,
  Shield,
  Lock,
  Key,
  Sparkles,
};

const initialFormData: CareNeedFormData = {
  labelEn: '',
  labelDe: '',
  labelFr: '',
  descriptionEn: '',
  descriptionDe: '',
  descriptionFr: '',
  icon: 'Heart',
};

export default function ConfigurationsPage() {
  const { t, language } = useTranslation();
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<CareNeedFormData>(initialFormData);
  const [deleteTarget, setDeleteTarget] = useState<CareNeed | null>(null);
  const [validationDialogOpen, setValidationDialogOpen] = useState(false);

  // React Query hooks
  const { data: careNeeds = [], isLoading } = useCareNeeds(true);
  const createMutation = useCreateCareNeed();
  const updateMutation = useUpdateCareNeed();
  const deleteMutation = useDeleteCareNeed();

  const getLabelByLanguage = (item: CareNeed) => {
    switch (language) {
      case 'de':
        return item.labelDe;
      case 'fr':
        return item.labelFr;
      default:
        return item.labelEn;
    }
  };

  const handleOpenForm = (careNeed?: CareNeed) => {
    if (careNeed) {
      setEditingId(careNeed.id);
      setFormData({
        labelEn: careNeed.labelEn,
        labelDe: careNeed.labelDe,
        labelFr: careNeed.labelFr,
        descriptionEn: careNeed.descriptionEn || '',
        descriptionDe: careNeed.descriptionDe || '',
        descriptionFr: careNeed.descriptionFr || '',
        icon: careNeed.icon || 'Heart',
      });
    } else {
      setEditingId(null);
      setFormData(initialFormData);
    }
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingId(null);
    setFormData(initialFormData);
  };

  const handleSave = async () => {
    // Validate required fields
    if (!formData.labelEn || !formData.labelDe || !formData.labelFr) {
      setValidationDialogOpen(true);
      return;
    }
    
    if (editingId) {
      await updateMutation.mutateAsync({ id: editingId, data: formData });
    } else {
      await createMutation.mutateAsync(formData);
    }
    handleCloseForm();
  };

  const handleToggleActive = async (careNeed: CareNeed) => {
    await updateMutation.mutateAsync({
      id: careNeed.id,
      data: { isActive: !careNeed.isActive } as Partial<CareNeedFormData>,
    });
  };

  const handleDelete = (careNeed: CareNeed) => {
    setDeleteTarget(careNeed);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    await deleteMutation.mutateAsync(deleteTarget.id);
    setDeleteTarget(null);
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <div className="p-3 bg-gray-100 rounded-xl">
          <Settings className="text-gray-600" size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('admin.config.title')}</h1>
          <p className="text-gray-500">{t('admin.config.subtitle')}</p>
        </div>
      </div>

      {/* Care Needs Panel */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {t('admin.config.careNeeds.title')}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {t('admin.config.careNeeds.subtitle')}
            </p>
          </div>
          <button
            onClick={() => handleOpenForm()}
            className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors cursor-pointer"
          >
            <Plus size={18} />
            {t('admin.config.careNeeds.add')}
          </button>
        </div>

        {/* Care needs list */}
        <div className="divide-y divide-gray-100">
          {isLoading ? (
            [...Array(5)].map((_, i) => (
              <div key={i} className="p-4 flex items-center gap-4 animate-pulse">
                <div className="w-10 h-10 bg-gray-200 rounded-lg" />
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-32 mb-2" />
                  <div className="h-3 bg-gray-200 rounded w-48" />
                </div>
              </div>
            ))
          ) : careNeeds.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              {t('admin.config.careNeeds.empty')}
            </div>
          ) : (
            careNeeds.map((careNeed) => {
              const IconComponent = careNeed.icon ? ICONS[careNeed.icon] : Heart;
              return (
                <div
                  key={careNeed.id}
                  className={`p-4 flex items-center gap-4 hover:bg-gray-50 transition-colors ${
                    !careNeed.isActive ? 'opacity-50' : ''
                  }`}
                >
                  <div className="flex items-center gap-2 text-gray-400">
                    <GripVertical size={18} className="cursor-grab" />
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
                    {IconComponent && <IconComponent size={20} className="text-amber-600" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900">{getLabelByLanguage(careNeed)}</p>
                      <span className="text-xs text-gray-400">({careNeed.key})</span>
                    </div>
                    <div className="flex gap-4 text-xs text-gray-500 mt-1">
                      <span>EN: {careNeed.labelEn}</span>
                      <span>DE: {careNeed.labelDe}</span>
                      <span>FR: {careNeed.labelFr}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleActive(careNeed)}
                      className={`px-3 py-1.5 text-xs rounded-full cursor-pointer transition-colors ${
                        careNeed.isActive
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {careNeed.isActive ? t('admin.status.active') : t('admin.status.inactive')}
                    </button>
                    <button
                      onClick={() => handleOpenForm(careNeed)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                    >
                      <Edit size={16} className="text-gray-500" />
                    </button>
                    <button
                      onClick={() => handleDelete(careNeed)}
                      className="p-2 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 size={16} className="text-red-500" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Add/Edit Form Modal */}
      <AnimatePresence>
        {isFormOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50"
              onClick={handleCloseForm}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  {editingId ? t('admin.config.careNeeds.edit') : t('admin.config.careNeeds.add')}
                </h3>
                <button
                  onClick={handleCloseForm}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                >
                  <X size={20} className="text-gray-500" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Icon selector */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('admin.config.careNeeds.icon')}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(ICONS).map(([name, Icon]) => (
                      <button
                        key={name}
                        onClick={() => setFormData({ ...formData, icon: name })}
                        className={`p-3 rounded-lg border-2 transition-colors cursor-pointer ${
                          formData.icon === name
                            ? 'border-amber-500 bg-amber-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <Icon size={20} className={formData.icon === name ? 'text-amber-600' : 'text-gray-500'} />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Labels */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      🇬🇧 {t('admin.config.careNeeds.labelEn')} *
                    </label>
                    <input
                      type="text"
                      value={formData.labelEn}
                      onChange={(e) => setFormData({ ...formData, labelEn: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none"
                      placeholder="Daily Living"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      🇩🇪 {t('admin.config.careNeeds.labelDe')} *
                    </label>
                    <input
                      type="text"
                      value={formData.labelDe}
                      onChange={(e) => setFormData({ ...formData, labelDe: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none"
                      placeholder="Alltägliche Aktivitäten"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      🇫🇷 {t('admin.config.careNeeds.labelFr')} *
                    </label>
                    <input
                      type="text"
                      value={formData.labelFr}
                      onChange={(e) => setFormData({ ...formData, labelFr: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none"
                      placeholder="Vie quotidienne"
                    />
                  </div>
                </div>

                {/* Descriptions */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      🇬🇧 {t('admin.config.careNeeds.descriptionEn')}
                    </label>
                    <textarea
                      value={formData.descriptionEn}
                      onChange={(e) => setFormData({ ...formData, descriptionEn: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none resize-none"
                      rows={3}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      🇩🇪 {t('admin.config.careNeeds.descriptionDe')}
                    </label>
                    <textarea
                      value={formData.descriptionDe}
                      onChange={(e) => setFormData({ ...formData, descriptionDe: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none resize-none"
                      rows={3}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      🇫🇷 {t('admin.config.careNeeds.descriptionFr')}
                    </label>
                    <textarea
                      value={formData.descriptionFr}
                      onChange={(e) => setFormData({ ...formData, descriptionFr: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none resize-none"
                      rows={3}
                    />
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
                <button
                  onClick={handleCloseForm}
                  className="px-4 py-2.5 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                >
                  {t('admin.actions.cancel')}
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {isSaving ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Save size={18} />
                  )}
                  {t('admin.actions.save')}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete confirmation modal */}
      <DeleteConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        itemName={deleteTarget ? getLabelByLanguage(deleteTarget) : ''}
        isLoading={deleteMutation.isPending}
      />

      <ConfirmDialog
        isOpen={validationDialogOpen}
        onClose={() => setValidationDialogOpen(false)}
        onConfirm={() => setValidationDialogOpen(false)}
        title={t('admin.config.careNeeds.allLabelsRequired')}
        message={t('admin.config.careNeeds.allLabelsRequired')}
        variant="info"
        showCancel={false}
        confirmText="OK"
      />
    </div>
  );
}
