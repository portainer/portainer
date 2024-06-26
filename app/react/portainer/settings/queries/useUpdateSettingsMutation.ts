import { useMutation, useQueryClient } from '@tanstack/react-query';

import axios, { parseAxiosError } from '@/portainer/services/axios';
import {
  mutationOptions,
  withError,
  withInvalidate,
} from '@/react-tools/react-query';

import { buildUrl } from '../build-url';
import { Settings } from '../types';

import { queryKeys } from './queryKeys';

type OptionalSettings = Omit<Partial<Settings>, 'Edge'> & {
  Edge?: Partial<Settings['Edge']>;
};

export async function updateSettings(settings: OptionalSettings) {
  try {
    const { data } = await axios.put<Settings>(buildUrl(), settings);
    return data;
  } catch (e) {
    throw parseAxiosError(e as Error, 'Unable to update application settings');
  }
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
