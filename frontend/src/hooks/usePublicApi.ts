'use client';

import { useQuery } from '@tanstack/react-query';
import { publicApi, CareNeed } from '@/lib/api';

// Query Keys
export const publicQueryKeys = {
  careNeeds: ['public', 'careNeeds'] as const,
};

// Public Care Needs Hook
export function useCareNeedsPublic() {
  return useQuery<CareNeed[]>({
    queryKey: publicQueryKeys.careNeeds,
    queryFn: () => publicApi.getCareNeeds(),
    staleTime: 5 * 60 * 1000, // 5 minutes - care needs don't change often
    retry: 2,
  });
}
