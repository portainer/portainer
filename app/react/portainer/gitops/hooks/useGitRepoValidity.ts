import { isAxiosError } from '@/portainer/services/axios/utils/isAxiosError';

import { isDefaultResponse } from '../../services/axios/utils/parseAxiosError';
import { AuthTypeOption } from '../../account/git-credentials/types';
import { useGitRefs } from '../queries/useGitRefs';

interface Creds {
  username?: string;
  password?: string;
  gitCredentialId?: number;
  authorizationType?: AuthTypeOption;
}

interface Params {
  url: string;
  creds?: Creds;
  force?: boolean;
  tlsSkipVerify?: boolean;
  createdFromCustomTemplateId?: number;
  fromEdgeStack?: boolean;
  stackId?: number;
  enabled?: boolean;
  onSettled?(isValid?: boolean): void;
  // run after onSettled, useful for clearing local flags like force
  onAfterSettle?(): void;
}

export function useGitRepoValidity({
  url,
  creds,
  force,
  tlsSkipVerify,
  fromEdgeStack,
  createdFromCustomTemplateId,
  stackId,
  enabled,
  onSettled,
  onAfterSettle,
}: Params) {
  const query = useGitRefs(
    {
      repository: url,
      ...creds,
      tlsSkipVerify,
      createdFromCustomTemplateID: createdFromCustomTemplateId,
      stackId,
      force,
      fromEdgeStack,
    },
    {
      enabled: !!url && enabled,
      select: () => true,
      suppressError: true,
      onSettled(isValid) {
        if (onSettled) {
          onSettled(isValid);
        }
        if (onAfterSettle) {
          onAfterSettle();
        }
      },
    }
  );

  const hasCreds =
    !!(creds?.username && creds?.password) || !!creds?.gitCredentialId;

  const errorMessage = getGitValidityError(query.error, hasCreds);

  const isChecking = query.isInitialLoading || query.isFetching;

  return {
    isValid: !!query.data && !query.isError,
    isChecking,
    hasError: query.isError,
    errorMessage,
    query,
  } as const;
}

export function getGitValidityError(error: unknown, hasCreds: boolean) {
  if (!isAxiosError(error)) return undefined;
  const responseData = error.response?.data;
  const details = isDefaultResponse(responseData)
    ? (responseData.details ?? '')
    : '';
  if (
    !hasCreds &&
    details === 'Authentication required: Repository not found.'
  ) {
    return 'Git repository could not be found or is private, please ensure that the URL is correct or credentials are provided.';
  }
  return details || undefined;
}
