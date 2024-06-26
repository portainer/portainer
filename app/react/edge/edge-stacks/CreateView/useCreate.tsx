import { useRouter } from '@uirouter/react';

import { useCurrentUser } from '@/react/hooks/useUser';
import { useAnalytics } from '@/react/hooks/useAnalytics';
import { TemplateViewModel } from '@/react/portainer/templates/app-templates/view-model';
import { CustomTemplate } from '@/react/portainer/templates/custom-templates/types';
import { notifySuccess } from '@/portainer/services/notifications';
import { transformAutoUpdateViewModel } from '@/react/portainer/gitops/AutoUpdateFieldset/utils';

import {
  BasePayload,
  CreateEdgeStackPayload,
  useCreateEdgeStack,
} from '../queries/useCreateEdgeStack/useCreateEdgeStack';
import { DeploymentType } from '../types';

import { FormValues, Method } from './types';

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
  const { user } = useCurrentUser();
  const { trackEvent } = useAnalytics();

  return {
    isLoading: mutation.isLoading,
    onSubmit: handleSubmit,
  };

  function handleSubmit(values: FormValues) {
    const method = getMethod(
      values.method,
      getIsGitTemplate(template, templateType)
    );
    trackEvent('edge-stack-creation', {
      category: 'edge',
      metadata: buildAnalyticsMetadata(
        values.method,
        values.deploymentType,
        template?.Title
      ),
    });

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
      return {
        userId: user.Id,
        deploymentType: values.deploymentType,
        edgeGroups: values.groupIds,
        name: values.name,
        envVars: values.envVars,
        registries: values.privateRegistryId ? [values.privateRegistryId] : [],
        prePullImage: values.prePullImage,
        retryDeploy: values.retryDeploy,
        staggerConfig: values.staggerConfig,
        useManifestNamespaces: values.useManifestNamespaces,
      };
    }
  }

  function buildAnalyticsMetadata(
    method: Method,
    type: DeploymentType,
    templateTitle: string | undefined
  ) {
    return {
      type: methodLabel(method),
      format: type === DeploymentType.Compose ? 'compose' : 'kubernetes',
      templateName: templateTitle,
    };

    function methodLabel(method: Method) {
      switch (method) {
        case 'repository':
          return 'git';
        case 'upload':
          return 'file-upload';
        case 'template':
          return 'template';
        case 'editor':
        default:
          return 'web-editor';
      }
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
