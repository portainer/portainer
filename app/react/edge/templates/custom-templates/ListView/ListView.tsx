import { notifySuccess } from '@/portainer/services/notifications';
import { useCustomTemplates } from '@/react/portainer/templates/custom-templates/queries/useCustomTemplates';
import { useDeleteTemplateMutation } from '@/react/portainer/templates/custom-templates/queries/useDeleteTemplateMutation';
import { CustomTemplate } from '@/react/portainer/templates/custom-templates/types';
import { CustomTemplatesList } from '@/react/portainer/templates/custom-templates/ListView/CustomTemplatesList';

import { PageHeader } from '@@/PageHeader';
import { confirmDelete } from '@@/modals/confirm';

export function ListView() {
  const templatesQuery = useCustomTemplates({
    params: {
      edge: true,
    },
  });
  const deleteMutation = useDeleteTemplateMutation();

  return (
    <>
      <PageHeader title="Custom Templates" breadcrumbs="Custom Templates" />

      <CustomTemplatesList
        templates={templatesQuery.data}
        onDelete={handleDelete}
        templateLinkParams={(template) => ({
          to: 'edge.stacks.new',
          params: { templateId: template.Id, templateType: 'custom' },
        })}
        storageKey="edge-custom-templates"
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
        notifySuccess('Success', 'Template deleted');
      },
    });
  }
}
