import { useQueryClient, useMutation } from 'react-query';

import { promiseSequence } from '@/portainer/helpers/promise-utils';
import axios, { parseAxiosError } from '@/portainer/services/axios';
import {
  mutationOptions,
  withError,
  withInvalidate,
} from '@/react-tools/react-query';
import { buildUrl } from '@/react/portainer/environments/environment.service/utils';
import { EnvironmentId } from '@/react/portainer/environments/types';

export function useHideEnvironmentsMutation() {
  const queryClient = useQueryClient();

  return useMutation(
    (ids: Array<EnvironmentId>) =>
      promiseSequence(ids.map((id) => () => hideEnvironment(id))),
    mutationOptions(
      withError('Failed to remove devices'),
      withInvalidate(queryClient, [['environments']])
    )
  );
}

export async function hideEnvironment(id: EnvironmentId) {
  try {
    await axios.post(buildUrl(id, 'edge/hide'));
  } catch (e) {
    throw parseAxiosError(e as Error);
  }
}
