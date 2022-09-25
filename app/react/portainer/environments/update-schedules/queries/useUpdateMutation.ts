import { useMutation, useQueryClient } from 'react-query';

import axios, { parseAxiosError } from '@/portainer/services/axios';
import { withError, withInvalidate } from '@/react-tools/react-query';

import { EdgeUpdateSchedule } from '../types';
import { FormValues } from '../common/types';

import { queryKeys } from './query-keys';
import { buildUrl } from './urls';

interface Update {
  id: EdgeUpdateSchedule['id'];
  values: FormValues;
}

async function update({ id, values }: Update) {
  try {
    const { data } = await axios.put<EdgeUpdateSchedule>(buildUrl(id), values);

    return data;
  } catch (err) {
    throw parseAxiosError(
      err as Error,
      'Failed to update edge update schedule'
    );
  }
}

export function useUpdateMutation() {
  const queryClient = useQueryClient();
  return useMutation(update, {
    ...withInvalidate(queryClient, [queryKeys.base()]),
    ...withError(),
  });
}
