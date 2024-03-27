import { useMutation, useQueryClient } from '@tanstack/react-query';

import {
  mutationOptions,
  withGlobalError,
  withInvalidate,
} from '@/react-tools/react-query';
import axios, { parseAxiosError } from '@/portainer/services/axios';

import { CustomTemplate } from '../types';

import { queryKeys } from './query-keys';
import { buildUrl } from './build-url';

export function useDeleteTemplateMutation() {
  const queryClient = useQueryClient();
  return useMutation(
    deleteTemplate,
    mutationOptions(
      withInvalidate(queryClient, [queryKeys.base()]),
      withGlobalError('Unable to delete custom template')
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
