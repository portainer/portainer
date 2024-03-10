import { useMutation } from '@tanstack/react-query';

import { EnvironmentId } from '@/react/portainer/environments/types';
import axios, { parseAxiosError } from '@/portainer/services/axios';

import { buildUrl } from './build-url';

export function useDeleteConfigMutation() {
  return useMutation({
    mutationFn: deleteConfig,
  });
}

export async function deleteConfig({
  environmentId,
  configId,
}: {
  environmentId: EnvironmentId;
  configId: string;
}) {
  try {
    await axios.delete(buildUrl(environmentId, configId));
  } catch (err) {
    throw parseAxiosError(err as Error, 'Unable to delete config');
  }
}
