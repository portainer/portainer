import { useMutation, useQueryClient } from '@tanstack/react-query';

import axios, { parseAxiosError } from '@/portainer/services/axios';
import {
  mutationOptions,
  withInvalidate,
  withError,
} from '@/react-tools/react-query';

import { DefaultRegistry } from '../types';
import { buildUrl } from '../build-url';

import { queryKeys } from './queryKeys';

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

export async function updateDefaultRegistry(
  defaultRegistry: Partial<DefaultRegistry>
) {
  try {
    await axios.put(buildUrl('default_registry'), defaultRegistry);
  } catch (e) {
    throw parseAxiosError(e, 'Unable to update default registry settings');
  }
}
