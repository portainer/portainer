import { useMutation } from '@tanstack/react-query';

import axios, { parseAxiosError } from '@/portainer/services/axios/axios';
import { withError } from '@/react-tools/react-query';

import { EnvironmentGroupId } from '../../types';

import { buildUrl } from './build-url';

export function useDeleteEnvironmentGroupMutation() {
  return useMutation({
    mutationFn: (id: EnvironmentGroupId) => deleteEnvironmentGroup(id),
    ...withError('Failed to delete environment group'),
  });
}

async function deleteEnvironmentGroup(id: EnvironmentGroupId) {
  try {
    await axios.delete(buildUrl(id));
  } catch (e) {
    throw parseAxiosError(e as Error, 'Unable to delete environment group');
  }
}
