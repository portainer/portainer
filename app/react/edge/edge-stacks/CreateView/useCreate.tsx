import { useRouter } from '@uirouter/react';

import { TemplateViewModel } from '@/react/portainer/templates/app-templates/view-model';
import { CustomTemplate } from '@/react/portainer/templates/custom-templates/types';
import { notifySuccess } from '@/portainer/services/notifications';
import { transformAutoUpdateViewModel } from '@/react/portainer/gitops/AutoUpdateFieldset/utils';

import {
  BasePayload,
  CreateEdgeStackPayload,
  useCreateEdgeStack,
} from '../queries/useCreateEdgeStack/useCreateEdgeStack';

import { FormValues } from './types';

export function useCreate({
  webhookId,
  template,
  templateType,
}: {
  webhookId: string;
  template: TemplateViewModel | CustomTemplate | undefined;
  templateType: 'app' | 'custom' | undefined;
}) {
  const router = useRouter();
  const mutation = useCreateEdgeStack();

  return {
    isLoading: mutation.isLoading,
    onSubmit: handleSubmit,
  };

  function handleSubmit(values: FormValues) {
    const method = getMethod(
      values.method,
      getIsGitTemplate(template, templateType)
    );

    mutation.mutate(getPayload(method, values), {
      onSuccess: () => {
        notifySuccess('Success', 'Edge stack created');
        router.stateService.go('^');
      },
    });

    function getPayload(
      method: 'string' | 'file' | 'git',
      values: FormValues
    ): CreateEdgeStackPayload {
      switch (method) {
        case 'file':
          if (!values.file) {
            throw new Error('File is required');
          }

          return {
            method: 'file',
            payload: {
              ...getBasePayload(values),
              file: values.file,
              webhook: values.enableWebhook ? webhookId : undefined,
            },
          };
        case 'string':
          return {
            method: 'string',
            payload: {
              ...getBasePayload(values),
              fileContent: values.fileContent,
              webhook: values.enableWebhook ? webhookId : undefined,
            },
          };
        case 'git':
          return {
            method: 'git',
            payload: {
              ...getBasePayload(values),
              git: values.git,
              relativePathSettings: values.relativePath,
              autoUpdate: transformAutoUpdateViewModel(
                values.git.AutoUpdate,
                webhookId
              ),
            },
          };
        default:
          throw new Error(`Unknown method: ${method}`);
      }
    }

    function getBasePayload(values: FormValues): BasePayload {
      const templateEnvVarsAsPairs = Object.entries(
        values.templateValues.envVars
      ).map(([name, value]) => ({
        name,
        value,
      }));
      return {
        deploymentType: values.deploymentType,
        edgeGroups: values.groupIds,
        name: values.name,
        envVars: [...values.envVars, ...templateEnvVarsAsPairs],
        registries: values.privateRegistryId ? [values.privateRegistryId] : [],
        prePullImage: values.prePullImage,
        retryDeploy: values.retryDeploy,
        staggerConfig: values.staggerConfig,
        useManifestNamespaces: values.useManifestNamespaces,
      };
    }
  }
}

function getMethod(
  method: 'template' | 'repository' | 'editor' | 'upload',
  isGitTemplate: boolean
): 'string' | 'file' | 'git' {
  switch (method) {
    case 'upload':
      return 'file';
    case 'repository':
      return 'git';
    case 'template':
      if (isGitTemplate) {
        return 'git';
      }
      return 'string';
    case 'editor':
    default:
      return 'string';
  }
}

function getIsGitTemplate(
  template: TemplateViewModel | CustomTemplate | undefined,
  templateType: 'app' | 'custom' | undefined
) {
  if (templateType === 'app') {
    return false;
  }

  return !!template && !!(template as CustomTemplate).GitConfig;
}
