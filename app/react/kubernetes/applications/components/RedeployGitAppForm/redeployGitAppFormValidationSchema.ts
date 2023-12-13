import { SchemaOf, boolean, object, string } from 'yup';

import { autoUpdateValidation } from '@/react/portainer/gitops/AutoUpdateFieldset/validation';
import { gitAuthValidation } from '@/react/portainer/gitops/AuthFieldset';
import { GitCredential } from '@/react/portainer/account/git-credentials/types';

import { KubeAppGitFormValues } from './types';

export function redeployGitAppFormValidationSchema(
  gitCredentials: Array<GitCredential>,
  isAuthEdit: boolean
): SchemaOf<KubeAppGitFormValues> {
  return object({
    authentication: gitAuthValidation(gitCredentials, isAuthEdit),
    repositoryURL: string().required('Repository URL is required'),
    tlsSkipVerify: boolean().required(),
    repositoryReferenceName: string().required('Branch is required'),
    autoUpdate: autoUpdateValidation(),
  });
}
