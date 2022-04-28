import { useMutation, useQuery, useQueryClient } from 'react-query';

import { getSettings, updateSettings } from './settings.service';
import { Settings } from './types';

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

export function useSettings<T = Settings>(select?: (settings: Settings) => T) {
  return useQuery(['settings'], getSettings, { select });
}
