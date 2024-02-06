import { AppTemplatesList } from '@/react/portainer/templates/app-templates/AppTemplatesList';
import { useAppTemplates } from '@/react/portainer/templates/app-templates/queries/useAppTemplates';
import { TemplateType } from '@/react/portainer/templates/app-templates/types';

import { PageHeader } from '@@/PageHeader';

export function AppTemplatesView() {
  const templatesQuery = useAppTemplates();

  return (
    <>
      <PageHeader title="Application templates list" breadcrumbs="Templates" />

      <AppTemplatesList
        templates={templatesQuery.data}
        templateLinkParams={(template) => ({
          to: 'edge.stacks.new',
          params: { templateId: template.Id, templateType: 'app' },
        })}
        disabledTypes={[TemplateType.Container]}
        fixedCategories={['edge']}
        storageKey="edge-app-templates"
      />
    </>
  );
}
