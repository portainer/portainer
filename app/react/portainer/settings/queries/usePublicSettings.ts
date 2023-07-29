import { useQuery } from 'react-query';

import { withError } from '@/react-tools/react-query';

import { getPublicSettings } from '../settings.service';
import { PublicSettingsResponse } from '../types';

import { queryKeys } from './queryKeys';

export function usePublicSettings<T = PublicSettingsResponse>({
  enabled,
  select,
  onSuccess,
}: {
  select?: (settings: PublicSettingsResponse) => T;
  enabled?: boolean;
  onSuccess?: (data: T) => void;
} = {}) {
  return useQuery(queryKeys.public(), getPublicSettings, {
    select,
    ...withError('Unable to retrieve public settings'),
    enabled,
    onSuccess,
  });
}
