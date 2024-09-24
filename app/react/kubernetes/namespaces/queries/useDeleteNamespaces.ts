import { useMutation, useQueryClient } from '@tanstack/react-query';

import axios, { parseAxiosError } from '@/portainer/services/axios';
import { withGlobalError, withInvalidate } from '@/react-tools/react-query';

import { queryKeys } from './queryKeys';

type DeleteNamespaceError = {
  namespaceName: string;
  error: string;
};

// when successful, the response will contain a list of deleted namespaces and a list of errors
type DeleteNamespacesResponse = {
  deleted: string[];
  errors: DeleteNamespaceError[];
} | null;

// useDeleteNamespaces is a react query mutation that removes a list of namespaces,
export function useDeleteNamespaces(environmentId: number) {
  const queryClient = useQueryClient();
  return useMutation(
    ({ namespaceNames }: { namespaceNames: string[] }) =>
      deleteNamespaces(environmentId, namespaceNames),
    {
      ...withInvalidate(queryClient, [queryKeys.list(environmentId)]),
      ...withGlobalError('Unable to delete namespaces'),
      // onSuccess handled by the caller
    }
  );
}

async function deleteNamespaces(
  environmentId: number,
  namespaceNames: string[]
) {
  try {
    return await axios.delete<DeleteNamespacesResponse>(
      `kubernetes/${environmentId}/namespaces`,
      {
        data: namespaceNames,
      }
    );
  } catch (e) {
    throw parseAxiosError(e, 'Unable to delete namespace');
  }
}
