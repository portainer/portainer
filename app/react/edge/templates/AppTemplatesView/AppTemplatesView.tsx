import { useParamState } from '@/react/hooks/useParamState';
import { AppTemplatesList } from '@/react/portainer/templates/app-templates/AppTemplatesList';
import { useAppTemplates } from '@/react/portainer/templates/app-templates/queries/useAppTemplates';
import { TemplateType } from '@/react/portainer/templates/app-templates/types';

import { PageHeader } from '@@/PageHeader';

import { DeployFormWidget } from './DeployForm';

export function AppTemplatesView() {
  const [selectedTemplateId, setSelectedTemplateId] = useParamState<number>(
    'template',
    (param) => (param ? parseInt(param, 10) : 0)
  );
  const templatesQuery = useAppTemplates();
  const selectedTemplate = selectedTemplateId
    ? templatesQuery.data?.find(
        (template) => template.Id === selectedTemplateId
      )
    : undefined;
  return (
    <>
      <PageHeader title="Application templates list" breadcrumbs="Templates" />
      {selectedTemplate && (
        <DeployFormWidget
          template={selectedTemplate}
          unselect={() => setSelectedTemplateId()}
        />
      )}

      <AppTemplatesList
        templates={templatesQuery.data}
        selectedId={selectedTemplateId}
        onSelect={(template) => setSelectedTemplateId(template.Id)}
        disabledTypes={[TemplateType.Container]}
        fixedCategories={['edge']}
        hideDuplicate
      />
    </>
  );
}
