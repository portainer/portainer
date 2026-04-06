import { useMutation, useQueryClient } from '@tanstack/react-query';

import i18n from '@/i18n';
import { withError, withInvalidate } from '@/react-tools/react-query';
import { useCurrentUser } from '@/react/hooks/useUser';
import { promiseSequence } from '@/portainer/helpers/promise-utils';
import axios, { parseAxiosError } from '@/portainer/services/axios/axios';

import { AccessToken } from '../../access-tokens/types';
import { buildUrl } from '../../access-tokens/queries/build-url';
import { queryKeys } from '../../access-tokens/queries/query-keys';

export function useDeleteAccessTokensMutation() {
  const { user } = useCurrentUser();

  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ids: Array<AccessToken['id']>) =>
      deleteAccessTokens(user.Id, ids),
    ...withError(i18n.t('access_tokens.remove_error')),
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
    throw parseAxiosError(e, i18n.t('access_tokens.remove_single_error'));
  }
}
