// API Configuration and Base Functions
export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: {
    message: string;
    code: string;
  };
}

export interface PaginatedResponse<T> {
  items: T[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
}

// Generic API call function
export async function apiCall<T>(
  endpoint: string,
  options?: RequestInit & { token?: string }
): Promise<T> {
  const { token, ...fetchOptions } = options || {};
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...fetchOptions?.headers,
  };
  
  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...fetchOptions,
    headers,
  });

  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.error?.message || `API Error: ${response.status}`);
  }

  return data.data;
}

// Admin API endpoints
export const adminApi = {
  // Analytics
  getAnalytics: (token: string) =>
    apiCall<Analytics>('/admin/analytics', { token }),

  // Supports
  createSupport: (token: string, data: SupportFormData) =>
    apiCall<Support>('/admin/supports', {
      method: 'POST',
      body: JSON.stringify(data),
      token,
    }),
  getSupports: (token: string, page: number, search?: string, limit: number = 20) => {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (search) params.append('search', search);
    return apiCall<PaginatedResponse<Support>>(`/admin/supports?${params}`, { token });
  },
  updateSupport: (token: string, id: number, data: Partial<Support>) =>
    apiCall<Support>(`/admin/supports/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
      token,
    }),
  deleteSupport: (token: string, id: number) =>
    apiCall<void>(`/admin/supports/${id}`, { method: 'DELETE', token }),

  // Care Givers
  getCareGivers: (token: string, page: number, search?: string, limit: number = 20) => {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (search) params.append('search', search);
    return apiCall<PaginatedResponse<CareGiver>>(`/admin/care-givers?${params}`, { token });
  },
  updateCareGiver: (token: string, id: number, data: Partial<CareGiver>) =>
    apiCall<CareGiver>(`/admin/care-givers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
      token,
    }),
  deleteCareGiver: (token: string, id: number) =>
    apiCall<void>(`/admin/care-givers/${id}`, { method: 'DELETE', token }),

  // Care Recipients
  getCareRecipients: (token: string, page: number, search?: string, limit: number = 20) => {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (search) params.append('search', search);
    return apiCall<PaginatedResponse<CareRecipient>>(`/admin/care-recipients?${params}`, { token });
  },
  updateCareRecipient: (token: string, id: number, data: Partial<CareRecipient>) =>
    apiCall<CareRecipient>(`/admin/care-recipients/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
      token,
    }),
  deleteCareRecipient: (token: string, id: number) =>
    apiCall<void>(`/admin/care-recipients/${id}`, { method: 'DELETE', token }),

  // Care Needs (Config)
  getCareNeeds: (token: string, includeInactive = false) =>
    apiCall<CareNeed[]>(`/admin/config/care-needs?includeInactive=${includeInactive}`, { token }),
  createCareNeed: (token: string, data: CareNeedFormData) =>
    apiCall<CareNeed>('/admin/config/care-needs', {
      method: 'POST',
      body: JSON.stringify(data),
      token,
    }),
  updateCareNeed: (token: string, id: number, data: Partial<CareNeedFormData>) =>
    apiCall<CareNeed>(`/admin/config/care-needs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
      token,
    }),
  deleteCareNeed: (token: string, id: number) =>
    apiCall<void>(`/admin/config/care-needs/${id}`, { method: 'DELETE', token }),
  toggleCareNeed: (token: string, id: number) =>
    apiCall<CareNeed>(`/admin/config/care-needs/${id}/toggle`, {
      method: 'PATCH',
      token,
    }),
};

// Types
export interface Analytics {
  totals: {
    admins: number;
    supports: number;
    careGivers: number;
    careRecipients: number;
    totalUsers: number;
  };
  active: {
    careGivers: number;
    careRecipients: number;
  };
  verified: {
    careGivers: number;
  };
  last30Days: {
    careGivers: number;
    careRecipients: number;
    total: number;
  };
  recentRegistrations: {
    careGivers: Array<{
      id: number;
      firstName: string;
      lastName: string;
      email: string;
      createdAt: string;
      isActive: boolean;
      isVerified: boolean;
    }>;
    careRecipients: Array<{
      id: number;
      firstName: string;
      lastName: string;
      email: string;
      createdAt: string;
      isActive: boolean;
    }>;
  };
}

export interface Support {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  isActive: boolean;
  createdAt: string;
  lastLoginAt: string | null;
}

export interface SupportFormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
  department?: string;
}

export interface CareGiver {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  city: string | null;
  isActive: boolean;
  isVerified: boolean;
  createdAt: string;
  lastLoginAt: string | null;
}

export interface CareRecipient {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  city: string | null;
  isActive: boolean;
  createdAt: string;
  lastLoginAt: string | null;
}

export interface CareNeed {
  id: number;
  key: string;
  labelEn: string;
  labelDe: string;
  labelFr: string;
  descriptionEn: string | null;
  descriptionDe: string | null;
  descriptionFr: string | null;
  icon: string | null;
  sortOrder: number;
  isActive: boolean;
}

export interface CareNeedFormData {
  labelEn: string;
  labelDe: string;
  labelFr: string;
  descriptionEn?: string;
  descriptionDe?: string;
  descriptionFr?: string;
  icon?: string;
}

// Public API (no auth required)
export const publicApi = {
  getCareNeeds: () =>
    apiCall<CareNeed[]>('/auth/care-needs'),
};
