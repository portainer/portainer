import { notifySuccess } from '@/portainer/services/notifications';
import { useParamState } from '@/react/hooks/useParamState';
import { ContainerEngine } from '@/react/portainer/environments/types';

import { PageHeader } from '@@/PageHeader';
import { confirmDelete } from '@@/modals/confirm';

import { useCustomTemplates } from '../queries/useCustomTemplates';
import { useDeleteTemplateMutation } from '../queries/useDeleteTemplateMutation';
import { CustomTemplate } from '../types';

import { StackFromCustomTemplateFormWidget } from './StackFromCustomTemplateFormWidget';
import { CustomTemplatesList } from './CustomTemplatesList';
import { useViewParams } from './useViewParams';

export function ListView() {
  const { params, getTemplateLinkParams, storageKey, viewType } =
    useViewParams();

  const templatesQuery = useCustomTemplates({
    params,
  });
  const deleteMutation = useDeleteTemplateMutation();
  const [selectedTemplateId] = useParamState<number>('template', (param) =>
    param ? parseInt(param, 10) : 0
  );

  return (
    <>
      <PageHeader title="Custom Templates" breadcrumbs="Custom Templates" />

      {viewType === ContainerEngine.Docker && !!selectedTemplateId && (
        <StackFromCustomTemplateFormWidget templateId={selectedTemplateId} />
      )}

      <CustomTemplatesList
        templates={templatesQuery.data}
        onDelete={handleDelete}
        templateLinkParams={getTemplateLinkParams}
        storageKey={storageKey}
        selectedId={selectedTemplateId}
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
