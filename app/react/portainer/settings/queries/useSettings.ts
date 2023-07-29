import { useQuery, useMutation, useQueryClient } from 'react-query';

import {
  mutationOptions,
  withError,
  withInvalidate,
} from '@/react-tools/react-query';

import {
  updateSettings,
  getSettings,
  updateDefaultRegistry,
} from '../settings.service';
import { DefaultRegistry, Settings } from '../types';

import { queryKeys } from './queryKeys';

export function useSettings<T = Settings>(
  select?: (settings: Settings) => T,
  enabled = true
) {
  return useQuery(queryKeys.base(), getSettings, {
    select,
    enabled,
    staleTime: 50,
    ...withError('Unable to retrieve settings'),
  });
}

export function useUpdateSettingsMutation() {
  const queryClient = useQueryClient();

  return useMutation(
    updateSettings,
    mutationOptions(
      withInvalidate(queryClient, [queryKeys.base(), ['cloud']]),
      withError('Unable to update settings')
    )
  );
}

export function useUpdateDefaultRegistrySettingsMutation() {
  const queryClient = useQueryClient();

  return useMutation(
    (payload: Partial<DefaultRegistry>) => updateDefaultRegistry(payload),
    mutationOptions(
      withInvalidate(queryClient, [queryKeys.base()]),
      withError('Unable to update default registry settings')
    )
  );
}
