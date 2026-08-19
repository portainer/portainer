import { useMemo } from 'react';
import { boolean, object, SchemaOf, string } from 'yup';

import { StackType } from '@/react/common/stacks/types';
import { buildGitValidationSchema } from '@/react/portainer/gitops/GitForm';

import { envVarValidation } from '@@/form-components/EnvironmentVariablesFieldset';

import { FormValues } from './types';

export function useValidationSchema(
  stackType: StackType
): SchemaOf<FormValues> {
  const isKubernetes = stackType === StackType.Kubernetes;

  return useMemo(
    () =>
      object({
        kube: isKubernetes
          ? object({
              name: string().default(''),
            }).required()
          : object({ name: string().default('') }).optional(),
        git: buildGitValidationSchema(isKubernetes ? 'manifest' : 'compose'),

        env: envVarValidation(),
        prune: boolean().default(false),
        redeployNow: boolean().default(false),
      }),
    [isKubernetes]
  );
}
