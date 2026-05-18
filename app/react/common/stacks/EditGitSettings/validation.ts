import { useMemo } from 'react';
import { boolean, object, SchemaOf, string } from 'yup';

import { StackType } from '@/react/common/stacks/types';
import { buildGitValidationSchema } from '@/react/portainer/gitops/GitForm';
import { useGitCredentials } from '@/react/portainer/account/git-credentials/git-credentials.service';
import { useCurrentUser } from '@/react/hooks/useUser';

import { envVarValidation } from '@@/form-components/EnvironmentVariablesFieldset';

import { FormValues } from './types';

export function useValidationSchema(
  stackType: StackType
): SchemaOf<FormValues> {
  const { user } = useCurrentUser();
  const gitCredentialsQuery = useGitCredentials(user.Id);
  const isKubernetes = stackType === StackType.Kubernetes;

  return useMemo(
    () =>
      object({
        kube: isKubernetes
          ? object({
              name: string().default(''),
            }).required()
          : object({ name: string().default('') }).optional(),
        git: buildGitValidationSchema(
          gitCredentialsQuery.data || [],
          false,
          isKubernetes ? 'manifest' : 'compose',
          true
        ),

        env: envVarValidation(),
        prune: boolean().default(false),
        redeployNow: boolean().default(false),
      }),
    [gitCredentialsQuery.data, isKubernetes]
  );
}
