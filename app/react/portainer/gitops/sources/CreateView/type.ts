import {
  type SourcesGitAuthenticationPayload,
  type SourcesGitSourceCreatePayload,
} from '@api/types.gen';

import {
  AccessControlFormData,
  ResourceControlOwnership,
} from '@/react/portainer/access-control/types';

import { CreateSourcePayload } from './useSourceCreateMutation';

type GitFormValues = {
  url: string;
  authentication: {
    authEnabled: boolean;
    username?: string;
    password?: string;
  };
  tlsSkipVerify?: boolean;
  /** Mirrors the connection-test result; not sent in the create payload. */
  connectionOk: boolean;
};

export const FormValueTypes = ['git', 'registry', 'helm'] as const;

export type FormValues = AccessControlFormData & {
  name: string;
  type: (typeof FormValueTypes)[number];
  git: GitFormValues;
};

export function formValuesToCreatePayload({
  name,
  type,
  git: { authentication, tlsSkipVerify, url },
  authorizedTeams,
  authorizedUsers,
  ownership,
}: FormValues): CreateSourcePayload {
  return {
    type,
    git: {
      name,
      tlsSkipVerify,
      url,
      authentication: buildAuthPayload(authentication),
      administratorsOnly: ownership === ResourceControlOwnership.ADMINISTRATORS,
      public: ownership === ResourceControlOwnership.PUBLIC,
      teamAccesses: authorizedTeams,
      userAccesses: authorizedUsers,
    },
  };
}

export function gitFormValuesToTestPayload({
  authentication,
  url,
  tlsSkipVerify,
}: GitFormValues): SourcesGitSourceCreatePayload {
  return {
    url,
    tlsSkipVerify,
    authentication: buildAuthPayload(authentication),
  };
}

function buildAuthPayload(
  auth: GitFormValues['authentication']
): SourcesGitAuthenticationPayload | undefined {
  const { authEnabled, username, password } = auth;
  if (!authEnabled || !username || !password) {
    return undefined;
  }
  return { username, password };
}
