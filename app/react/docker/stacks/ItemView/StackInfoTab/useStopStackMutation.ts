import { useMutation } from '@tanstack/react-query';

import axios, { parseAxiosError } from '@/portainer/services/axios/axios';
import { buildStackUrl } from '@/react/common/stacks/queries/buildUrl';
import { Stack } from '@/react/common/stacks/types';

export function useStopStackMutation() {
  return useMutation({
    mutationFn: stopStack,
  });
}

async function stopStack({
  id,
  environmentId,
}: {
  id: Stack['Id'];
  environmentId?: number;
}) {
  try {
    const { data } = await axios.post<Stack>(
      buildStackUrl(id, 'stop'),
      undefined,
      { params: { endpointId: environmentId } }
    );
    return data;
  } catch (e) {
    throw parseAxiosError(e, 'Unable to stop stack');
  }
}
