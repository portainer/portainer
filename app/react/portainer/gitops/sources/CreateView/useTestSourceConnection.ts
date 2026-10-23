import { useQuery } from '@tanstack/react-query';

import { gitOpsSourcesTest } from '@api/sdk.gen';
import { type SourcesGitSourceCreatePayload } from '@api/types.gen';

import { strToHash } from '@/react/utils/hash';

import { sourceQueryKeys } from '../queries/query-keys';

export function useTestSourceConnection(
  payload: SourcesGitSourceCreatePayload | undefined
) {
  const payloadHashedPassword = {
    ...payload,

    authentication: {
      ...payload?.authentication,
      password: null,
      passwordHash: payload?.authentication?.password
        ? strToHash(payload.authentication.password)
        : undefined,
    },
  };

  return useQuery({
    queryKey: [
      ...sourceQueryKeys.all,
      'connection-test',
      payloadHashedPassword,
    ],
    queryFn: async () => {
      if (!payload) {
        throw new Error('Connection details are required');
      }
      const { data } = await gitOpsSourcesTest({ body: payload });
      return data;
    },
    enabled: !!payload,
    retry: false,
    refetchOnWindowFocus: false,
    staleTime: 5000,
  });
}
