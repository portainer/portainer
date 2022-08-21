import { useMutation, useQueryClient } from 'react-query';

import axios, { parseAxiosError } from '@/portainer/services/axios';
import { withError, withInvalidate } from '@/react-tools/react-query';

import { EdgeUpdateSchedule } from '../types';
import { FormValues } from '../CreateView/types';

import { queryKeys } from './query-keys';

async function create(schedule: FormValues) {
  try {
    const { data } = await axios.post<EdgeUpdateSchedule>(
      '/edge_update_schedules',
      schedule
    );

    return data;
  } catch (err) {
    throw parseAxiosError(
      err as Error,
      'Failed to create edge update schedule'
    );
  }
}

export function useCreateMutation() {
  const queryClient = useQueryClient();
  return useMutation(create, {
    ...withInvalidate(queryClient, [queryKeys.list()]),
    ...withError(),
  });
}
