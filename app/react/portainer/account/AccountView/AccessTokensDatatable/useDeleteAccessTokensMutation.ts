import { useMutation, useQueryClient } from '@tanstack/react-query';

import { withError, withInvalidate } from '@/react-tools/react-query';
import { useCurrentUser } from '@/react/hooks/useUser';
import { promiseSequence } from '@/portainer/helpers/promise-utils';
import axios, { parseAxiosError } from '@/portainer/services/axios';

import { AccessToken } from '../../access-tokens/types';
import { buildUrl } from '../../access-tokens/queries/build-url';
import { queryKeys } from '../../access-tokens/queries/query-keys';

export function useDeleteAccessTokensMutation() {
  const { user } = useCurrentUser();

  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ids: Array<AccessToken['id']>) =>
      deleteAccessTokens(user.Id, ids),
    ...withError('Failed to delete access tokens'),
    ...withInvalidate(queryClient, [queryKeys.base(user.Id)]),
  });
}

async function deleteAccessTokens(
  userId: number,
  tokenIds: Array<AccessToken['id']>
) {
  return promiseSequence(
    tokenIds.map((tokenId) => () => deleteAccessToken(userId, tokenId))
  );
}

async function deleteAccessToken(userId: number, id: AccessToken['id']) {
  try {
    await axios.delete(buildUrl(userId, id));
  } catch (e) {
    throw parseAxiosError(e, 'Unable to delete access token');
  }
}
