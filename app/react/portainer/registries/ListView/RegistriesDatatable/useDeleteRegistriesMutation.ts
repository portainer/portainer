import { useMutation, useQueryClient } from '@tanstack/react-query';

import { promiseSequence } from '@/portainer/helpers/promise-utils';
import axios, { parseAxiosError } from '@/portainer/services/axios';
import {
  mutationOptions,
  withError,
  withInvalidate,
} from '@/react-tools/react-query';

import { buildUrl } from '../../queries/build-url';
import { queryKeys } from '../../queries/query-keys';
import { Registry } from '../../types/registry';

export function useDeleteRegistriesMutation() {
  const queryClient = useQueryClient();
  return useMutation(
    (RegistryIds: Array<Registry['Id']>) =>
      promiseSequence(
        RegistryIds.map((RegistryId) => () => deleteRegistry(RegistryId))
      ),
    mutationOptions(
      withError('Unable to delete registries'),
      withInvalidate(queryClient, [queryKeys.base()])
    )
  );
}

async function deleteRegistry(id: Registry['Id']) {
  try {
    await axios.delete(buildUrl(id));
  } catch (e) {
    throw parseAxiosError(e, 'Unable to delete registries');
  }
}
