'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import {
  adminApi,
  Analytics,
  Support,
  SupportFormData,
  CareGiver,
  CareRecipient,
  CareNeed,
  CareNeedFormData,
  PaginatedResponse,
} from '@/lib/api';

// Query Keys
export const queryKeys = {
  analytics: ['admin', 'analytics'] as const,
  supports: (page: number, search?: string, limit?: number) => ['admin', 'supports', page, search, limit] as const,
  careGivers: (page: number, search?: string, limit?: number) => ['admin', 'careGivers', page, search, limit] as const,
  careRecipients: (page: number, search?: string, limit?: number) => ['admin', 'careRecipients', page, search, limit] as const,
  careNeeds: (includeInactive?: boolean) => ['admin', 'careNeeds', includeInactive] as const,
};

// Analytics Hook
export function useAnalytics() {
  const { token } = useAuth();

  return useQuery<Analytics>({
    queryKey: queryKeys.analytics,
    queryFn: () => adminApi.getAnalytics(token!),
    enabled: !!token,
    staleTime: 30 * 1000, // 30 seconds
    retry: 1,
  });
}

// Supports Hooks
export function useSupports(page: number, search?: string, limit: number = 20) {
  const { token } = useAuth();

  return useQuery<PaginatedResponse<Support>>({
    queryKey: queryKeys.supports(page, search, limit),
    queryFn: () => adminApi.getSupports(token!, page, search, limit),
    enabled: !!token,
    staleTime: 30 * 1000,
  });
}

export function useCreateSupport() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: SupportFormData) => adminApi.createSupport(token!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'supports'] });
    },
  });
}

export function useUpdateSupport() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Support> }) =>
      adminApi.updateSupport(token!, id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'supports'] });
    },
  });
}

export function useDeleteSupport() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => adminApi.deleteSupport(token!, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'supports'] });
    },
  });
}

// Care Givers Hooks
export function useCareGivers(page: number, search?: string, limit: number = 20) {
  const { token } = useAuth();

  return useQuery<PaginatedResponse<CareGiver>>({
    queryKey: queryKeys.careGivers(page, search, limit),
    queryFn: () => adminApi.getCareGivers(token!, page, search, limit),
    enabled: !!token,
    staleTime: 30 * 1000,
  });
}

export function useUpdateCareGiver() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CareGiver> }) =>
      adminApi.updateCareGiver(token!, id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'careGivers'] });
    },
  });
}

export function useDeleteCareGiver() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => adminApi.deleteCareGiver(token!, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'careGivers'] });
    },
  });
}

// Care Recipients Hooks
export function useCareRecipients(page: number, search?: string, limit: number = 20) {
  const { token } = useAuth();

  return useQuery<PaginatedResponse<CareRecipient>>({
    queryKey: queryKeys.careRecipients(page, search, limit),
    queryFn: () => adminApi.getCareRecipients(token!, page, search, limit),
    enabled: !!token,
    staleTime: 30 * 1000,
  });
}

export function useUpdateCareRecipient() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CareRecipient> }) =>
      adminApi.updateCareRecipient(token!, id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'careRecipients'] });
    },
  });
}

export function useDeleteCareRecipient() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => adminApi.deleteCareRecipient(token!, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'careRecipients'] });
    },
  });
}

// Care Needs Hooks
export function useCareNeeds(includeInactive = false) {
  const { token } = useAuth();

  return useQuery<CareNeed[]>({
    queryKey: queryKeys.careNeeds(includeInactive),
    queryFn: () => adminApi.getCareNeeds(token!, includeInactive),
    enabled: !!token,
    staleTime: 60 * 1000, // 1 minute
  });
}

export function useCreateCareNeed() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CareNeedFormData) => adminApi.createCareNeed(token!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'careNeeds'] });
    },
  });
}

export function useUpdateCareNeed() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CareNeedFormData> }) =>
      adminApi.updateCareNeed(token!, id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'careNeeds'] });
    },
  });
}

export function useDeleteCareNeed() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => adminApi.deleteCareNeed(token!, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'careNeeds'] });
    },
  });
}

export function useToggleCareNeed() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => adminApi.toggleCareNeed(token!, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'careNeeds'] });
    },
  });
}
