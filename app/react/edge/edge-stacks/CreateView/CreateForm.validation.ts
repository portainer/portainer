import {
  SchemaOf,
  array,
  boolean,
  lazy,
  mixed,
  number,
  object,
  string,
} from 'yup';
import { useMemo } from 'react';
import Lazy from 'yup/lib/Lazy';

import { buildGitValidationSchema } from '@/react/portainer/gitops/GitForm';
import { useGitCredentials } from '@/react/portainer/account/git-credentials/git-credentials.service';
import { useCurrentUser } from '@/react/hooks/useUser';
import { relativePathValidation } from '@/react/portainer/gitops/RelativePathFieldset/validation';
import { CustomTemplate } from '@/react/portainer/templates/custom-templates/types';
import { TemplateViewModel } from '@/react/portainer/templates/app-templates/view-model';
import { DeployMethod, GitFormModel } from '@/react/portainer/gitops/types';

import { envVarValidation } from '@@/form-components/EnvironmentVariablesFieldset';
import { file } from '@@/form-components/yup-file-validation';

import { DeploymentType } from '../types';
import { staggerConfigValidation } from '../components/StaggerFieldset';

import { FormValues, Method } from './types';
import { templateFieldsetValidation } from './TemplateFieldset/validation';
import { useNameValidation } from './NameField';

export function useValidation({
  appTemplate,
  customTemplate,
}: {
  appTemplate: TemplateViewModel | undefined;
  customTemplate: CustomTemplate | undefined;
}): Lazy<SchemaOf<FormValues>> {
  const { user } = useCurrentUser();
  const gitCredentialsQuery = useGitCredentials(user.Id);
  const nameValidation = useNameValidation();

  return useMemo(
    () =>
      lazy((values: FormValues) =>
        object({
          method: mixed<Method>()
            .oneOf(['editor', 'upload', 'repository', 'template'])
            .required(),
          name: nameValidation(values.groupIds),
          groupIds: array(number().required())
            .required()
            .min(1, 'At least one Edge group is required'),
          deploymentType: mixed<DeploymentType>()
            .oneOf([DeploymentType.Compose, DeploymentType.Kubernetes])
            .required(),
          envVars: envVarValidation(),
          privateRegistryId: number().default(0),
          prePullImage: boolean().default(false),
          retryDeploy: boolean().default(false),
          enableWebhook: boolean().default(false),
          staggerConfig: staggerConfigValidation(),
          fileContent: string()
            .default('')
            .when('method', {
              is: 'editor',
              then: (schema) => schema.required('Config file is required'),
            }),
          file: file().when('method', {
            is: 'upload',
            then: (schema) => schema.required(),
          }),
          templateValues: templateFieldsetValidation({
            customVariablesDefinitions: customTemplate?.Variables || [],
            envVarDefinitions: appTemplate?.Env || [],
          }),
          git: mixed().when('method', {
            is: 'repository',
            then: () => {
              const deploymentMethod: DeployMethod =
                values.deploymentType === DeploymentType.Compose
                  ? 'compose'
                  : 'manifest';
              return buildGitValidationSchema(
                gitCredentialsQuery.data || [],
                !!customTemplate,
                deploymentMethod
              );
            },
          }) as SchemaOf<GitFormModel>,
          relativePath: relativePathValidation(),
          useManifestNamespaces: boolean().default(false),
        })
      ),
    [appTemplate?.Env, customTemplate, gitCredentialsQuery.data, nameValidation]
  );
}
