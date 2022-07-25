import { useMutation, useQuery, useQueryClient } from 'react-query';

import {
  mutationOptions,
  withError,
  withInvalidate,
} from '@/react-tools/react-query';

import { PublicSettingsViewModel } from '../models/settings';

import {
  getSettings,
  updateSettings,
  getPublicSettings,
} from './settings.service';
import { Settings } from './types';

export function usePublicSettings<T = PublicSettingsViewModel>({
  enabled,
  select,
}: {
  select?: (settings: PublicSettingsViewModel) => T;
  enabled?: boolean;
} = {}) {
  return useQuery(['settings', 'public'], () => getPublicSettings(), {
    select,
    ...withError('Unable to retrieve public settings'),
    enabled,
  });
}

export function useSettings<T = Settings>(
  select?: (settings: Settings) => T,
  enabled?: boolean
) {
  return useQuery(['settings'], getSettings, {
    select,
    enabled,
    ...withError('Unable to retrieve settings'),
  });
}

export function useUpdateSettingsMutation() {
  const queryClient = useQueryClient();

  return useMutation(
    updateSettings,
    mutationOptions(
      withInvalidate(queryClient, [['settings'], ['cloud']]),
      withError('Unable to update settings')
    )
  );
}
