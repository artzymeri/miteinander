'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from '@/context/LanguageContext';
import { AlertTriangle, X } from 'lucide-react';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  itemName: string;
  isLoading?: boolean;
}

export default function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  itemName,
  isLoading,
}: DeleteConfirmModalProps) {
  const { t } = useTranslation();

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/50"
          onClick={onClose}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6"
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>

          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
              <AlertTriangle className="text-red-600" size={32} />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {t('admin.modal.deleteConfirmTitle')}
            </h3>
            <p className="text-gray-500 mb-6">
              {t('admin.modal.deleteConfirmText')} <span className="font-medium text-gray-900">{itemName}</span>?
            </p>

            <div className="flex gap-3 w-full">
              <button
                onClick={onClose}
                disabled={isLoading}
                className="flex-1 px-4 py-2.5 text-gray-700 border border-gray-200 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
              >
                {t('admin.modal.cancel')}
              </button>
              <button
                onClick={onConfirm}
                disabled={isLoading}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white hover:bg-red-700 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
              >
                {isLoading ? t('admin.modal.deleting') : t('admin.modal.delete')}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
