import { useMutation, useQuery, useQueryClient } from 'react-query';

import { notifyError } from '@/portainer/services/notifications';

import { PublicSettingsViewModel } from '../models/settings';

import {
  publicSettings,
  getSettings,
  updateSettings,
} from './settings.service';
import { Settings } from './types';

export function usePublicSettings<T = PublicSettingsViewModel>(
  select?: (settings: PublicSettingsViewModel) => T
) {
  return useQuery(['settings', 'public'], () => publicSettings(), {
    onError: (err) => {
      notifyError('Failure', err as Error, 'Unable to retrieve settings');
    },
    select,
  });
}

export function useSettings<T = Settings>(
  select?: (settings: Settings) => T,
  enabled?: boolean
) {
  return useQuery(['settings'], getSettings, {
    select,
    enabled,
    meta: {
      error: {
        title: 'Failure',
        message: 'Unable to retrieve settings',
      },
    },
  });
}

export function useUpdateSettingsMutation() {
  const queryClient = useQueryClient();

  return useMutation(updateSettings, {
    onSuccess() {
      return queryClient.invalidateQueries(['settings']);
    },
    meta: {
      error: {
        title: 'Failure',
        message: 'Unable to update settings',
      },
    },
  });
}
