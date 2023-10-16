import { notifySuccess } from '@/portainer/services/notifications';
import { useParamState } from '@/react/hooks/useParamState';
import { useCustomTemplates } from '@/react/portainer/templates/custom-templates/queries/useCustomTemplates';
import { useDeleteTemplateMutation } from '@/react/portainer/templates/custom-templates/queries/useDeleteTemplateMutation';
import { CustomTemplate } from '@/react/portainer/templates/custom-templates/types';
import { CustomTemplatesList } from '@/react/portainer/templates/custom-templates/ListView/CustomTemplatesList';

import { PageHeader } from '@@/PageHeader';
import { confirmDelete } from '@@/modals/confirm';

import { DeployFormWidget } from './DeployForm';

export function ListView() {
  const [selectedTemplateId, setSelectedTemplateId] = useParamState(
    'customTemplate',
    (param) => (param ? parseInt(param, 10) : 0)
  );
  const templatesQuery = useCustomTemplates({
    select(templates) {
      return templates.filter((t) => t.EdgeTemplate);
    },
  });
  const deleteMutation = useDeleteTemplateMutation();
  const selectedTemplate = templatesQuery.data?.find(
    (t) => t.Id === selectedTemplateId
  );
  return (
    <>
      <PageHeader title="Custom Templates" breadcrumbs="Custom Templates" />

      <DeployFormWidget
        template={selectedTemplate}
        unselect={() => setSelectedTemplateId()}
      />

      <CustomTemplatesList
        templates={templatesQuery.data}
        selectedId={selectedTemplateId}
        onSelect={(templateId) => setSelectedTemplateId(templateId)}
        onDelete={handleDelete}
      />
    </>
  );

  async function handleDelete(templateId: CustomTemplate['Id']) {
    if (
      !(await confirmDelete('Are you sure you want to delete this template?'))
    ) {
      return;
    }

    deleteMutation.mutate(templateId, {
      onSuccess: () => {
        if (selectedTemplateId === templateId) {
          setSelectedTemplateId(0);
        }
        notifySuccess('Success', 'Template deleted');
      },
    });
  }
}
