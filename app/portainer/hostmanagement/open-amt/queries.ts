import { useMutation } from 'react-query';

import { activateDevice } from './open-amt.service';

export const activateDeviceMutationKey = [
  'environments',
  'open-amt',
  'activate',
];

export function useActivateDeviceMutation() {
  return useMutation(activateDevice, {
    mutationKey: activateDeviceMutationKey,
    meta: {
      message: 'Unable to associate with OpenAMT',
    },
  });
}
