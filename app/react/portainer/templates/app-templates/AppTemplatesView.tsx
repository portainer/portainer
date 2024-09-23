import { useParamState } from '@/react/hooks/useParamState';
import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';
import { useInfo } from '@/react/docker/proxy/queries/useInfo';
import { useApiVersion } from '@/react/docker/proxy/queries/useVersion';
import { useAuthorizations } from '@/react/hooks/useUser';

import { PageHeader } from '@@/PageHeader';

import { TemplateType } from './types';
import { useAppTemplates } from './queries/useAppTemplates';
import { AppTemplatesList } from './AppTemplatesList';
import { DeployForm } from './DeployFormWidget/DeployFormWidget';

export function AppTemplatesView() {
  const envId = useEnvironmentId(false);

  const hasCreateAuthQuery = useAuthorizations([
    'DockerContainerCreate',
    'PortainerStackCreate',
  ]);
  const [selectedTemplateId, setSelectedTemplateId] = useParamState<number>(
    'template',
    (param) => (param ? parseInt(param, 10) : 0)
  );
  const templatesQuery = useAppTemplates({ environmentId: envId });
  const selectedTemplate = selectedTemplateId
    ? templatesQuery.data?.find(
        (template) => template.Id === selectedTemplateId
      )
    : undefined;

  const { disabledTypes, fixedCategories, tableKey } = useViewFilter(envId);

  return (
    <>
      <PageHeader title="Application templates list" breadcrumbs="Templates" />
      {selectedTemplate && (
        <DeployForm
          template={selectedTemplate}
          unselect={() => setSelectedTemplateId()}
        />
      )}

      <AppTemplatesList
        templates={templatesQuery.data}
        selectedId={selectedTemplateId}
        onSelect={
          envId && hasCreateAuthQuery.authorized
            ? (template) => setSelectedTemplateId(template.Id)
            : undefined
        }
        disabledTypes={disabledTypes}
        fixedCategories={fixedCategories}
        storageKey={tableKey}
        templateLinkParams={
          !envId
            ? (template) => ({
                to: 'edge.stacks.new',
                params: { templateId: template.Id, templateType: 'app' },
              })
            : undefined
        }
      />
    </>
  );
}

function useViewFilter(envId: number | undefined) {
  const envInfoQuery = useInfo(envId);
  const apiVersion = useApiVersion(envId);

  if (!envId) {
    // edge
    return {
      disabledTypes: [TemplateType.Container],
      fixedCategories: ['edge'],
      tableKey: 'edge-app-templates',
    };
  }

  const showSwarmStacks =
    apiVersion >= 1.25 &&
    envInfoQuery.data &&
    envInfoQuery.data.Swarm &&
    envInfoQuery.data.Swarm.NodeID &&
    envInfoQuery.data.Swarm.ControlAvailable;

  return {
    disabledTypes: !showSwarmStacks ? [TemplateType.SwarmStack] : [],
    tableKey: 'docker-app-templates',
  };
}
