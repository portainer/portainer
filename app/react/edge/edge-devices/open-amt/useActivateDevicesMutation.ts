import { useMutation } from '@tanstack/react-query';

import { promiseSequence } from '@/portainer/helpers/promise-utils';
import { mutationOptions, withError } from '@/react-tools/react-query';
import { EnvironmentId } from '@/react/portainer/environments/types';
import axios, { parseAxiosError } from '@/portainer/services/axios';

export function useActivateDevicesMutation() {
  return useMutation(
    (environmentIds: EnvironmentId[]) =>
      promiseSequence(environmentIds.map((id) => () => activateDevice(id))),
    mutationOptions(withError('Unable to associate with OpenAMT'))
  );
}

async function activateDevice(environmentId: EnvironmentId) {
  try {
    await axios.post(`/open_amt/${environmentId}/activate`);
  } catch (e) {
    throw parseAxiosError(e as Error, 'Unable to activate device');
  }
}
