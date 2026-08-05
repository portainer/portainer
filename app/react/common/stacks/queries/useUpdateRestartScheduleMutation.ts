import { useMutation, useQueryClient } from '@tanstack/react-query';

import axios, { parseAxiosError } from '@/portainer/services/axios/axios';

import { buildStackUrl } from './buildUrl';
import { queryKeys } from './query-keys';
import { Stack, StackRestartSchedule } from '../types';

type UpdateRestartScheduleParams = {
  stackId: Stack['Id'];
  environmentId: Stack['EndpointId'];
  restartSchedule: StackRestartSchedule | null;
};

export function useUpdateRestartScheduleMutation(stackId: Stack['Id']) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: UpdateRestartScheduleParams) =>
      updateRestartSchedule(params),
    onSuccess(updatedStack) {
      queryClient.setQueryData(queryKeys.stack(stackId), updatedStack);
    },
  });
}

async function updateRestartSchedule({
  stackId,
  environmentId,
  restartSchedule,
}: UpdateRestartScheduleParams): Promise<Stack> {
  try {
    const { data } = await axios.put<Stack>(
      buildStackUrl(stackId, 'restart/schedule'),
      {
        RestartSchedule: restartSchedule,
      },
      {
        params: { endpointId: environmentId },
      }
    );

    return data;
  } catch (e) {
    throw parseAxiosError(e, 'Unable to update stack restart schedule');
  }
}
