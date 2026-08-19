import { useMutation, useQueryClient } from '@tanstack/react-query';

import {
  mutationOptions,
  withError,
  withInvalidate,
} from '@/react-tools/react-query';
import axios, { parseAxiosError } from '@/portainer/services/axios/axios';

import { CustomTemplate } from '../types';

import { queryKeys } from './query-keys';
import { buildUrl } from './build-url';

export function useDeleteTemplateMutation() {
  const queryClient = useQueryClient();
  return useMutation(
    deleteTemplate,
    mutationOptions(
      withInvalidate(queryClient, [queryKeys.base()]),
      withError('Unable to delete custom template')
    )
  );
}
export async function deleteTemplate(id: CustomTemplate['Id']) {
  try {
    await axios.delete(buildUrl({ id }));
  } catch (e) {
    throw parseAxiosError(e, 'Unable to get custom template');
  }
}
