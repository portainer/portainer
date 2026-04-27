import { useQuery } from '@tanstack/react-query';

import axios from '@/portainer/services/axios/axios';
import { isBE } from '@/react/portainer/feature-flags/feature-flags.service';
import { withGlobalError } from '@/react-tools/react-query';

import { AuthTypeOption } from '../../account/git-credentials/types';
import { omitPassword } from '../utils';

interface RefsPayload {
  repository: string;
  username?: string;
  password?: string;
  authorizationType?: AuthTypeOption;
  gitCredentialId?: number;
  stackId?: number;
  fromEdgeStack?: boolean;
  createdFromCustomTemplateID?: number;
  tlsSkipVerify?: boolean;
  force?: boolean;
}

export function useGitRefs<T = string[]>(
  payload: RefsPayload,
  {
    enabled,
    select,
    onSuccess,
    onSettled,
    suppressError,
    cacheTime = 0,
  }: {
    enabled?: boolean;
    select?: (data: string[]) => T;
    onSuccess?(data: T): void;
    onSettled?(data: T | undefined, error: unknown): void;
    suppressError?: boolean;
    cacheTime?: number;
  } = {}
) {
  return useQuery({
    queryKey: ['gitops', 'refs', omitPassword(payload)],
    queryFn: () => listRefs(payload),
    enabled: isBE && enabled,
    retry: false,
    cacheTime,
    select,
    onSuccess,
    onSettled,
    ...(suppressError ? {} : withGlobalError('Failed loading refs')),
  });
}

export async function listRefs({ force, ...body }: RefsPayload) {
  const { data } = await axios.post<string[]>('/gitops/repo/refs', body, {
    params: { force },
  });
  return data;
}
