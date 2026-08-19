import { StackType } from '@/react/common/stacks/types';
import { useAuthorizations } from '@/react/hooks/useUser';

import { CustomTemplatesListParams } from '../queries/useCustomTemplates';
import { CustomTemplate } from '../types';
import { TemplateViewType, useViewType } from '../useViewType';

export function useViewParams(): {
  viewType: TemplateViewType;
  params: CustomTemplatesListParams;
  getTemplateLinkParams?: (template: CustomTemplate) => {
    to: string;
    params: object;
  };
  storageKey: string;
} {
  const viewType = useViewType();

  const isAllowedDeploymentKubeQuery = useAuthorizations(
    'K8sApplicationsAdvancedDeploymentRW'
  );
  const isAllowedDeploymentDockerQuery = useAuthorizations([
    'DockerContainerCreate',
    'PortainerStackCreate',
  ]);

  switch (viewType) {
    case 'kube':
      return {
        viewType,
        params: { edge: false, type: [StackType.Kubernetes] },
        getTemplateLinkParams: isAllowedDeploymentKubeQuery.authorized
          ? (template: CustomTemplate) => ({
              to: 'kubernetes.deploy',
              params: { templateId: template.Id, templateType: 'custom' },
            })
          : undefined,
        storageKey: 'kube-custom-templates',
      };
    case 'edge':
      return {
        viewType,
        params: { edge: true },
        getTemplateLinkParams: (template: CustomTemplate) => ({
          to: 'edge.stacks.new',
          params: { templateId: template.Id, templateType: 'custom' },
        }),
        storageKey: 'edge-custom-templates',
      };
    case 'docker':
      return {
        viewType,
        params: {
          edge: false,
          type: [StackType.DockerCompose, StackType.DockerSwarm],
        },
        getTemplateLinkParams: isAllowedDeploymentDockerQuery.authorized
          ? (template: CustomTemplate) => ({
              to: '.',
              params: { template: template.Id },
            })
          : undefined,
        storageKey: 'docker-custom-templates',
      };
    default:
      return {
        viewType,
        params: {},
        getTemplateLinkParams: undefined,
        storageKey: 'custom-templates',
      };
  }
}
