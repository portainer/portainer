import { useTranslation } from 'react-i18next';

import { notifySuccess } from '@/portainer/services/notifications';
import { useParamState } from '@/react/hooks/useParamState';
import { ContainerEngine } from '@/react/portainer/environments/types';
import i18n from '@/i18n';

import { PageHeader } from '@@/PageHeader';
import { confirmDelete } from '@@/modals/confirm';

import { useCustomTemplates } from '../queries/useCustomTemplates';
import { useDeleteTemplateMutation } from '../queries/useDeleteTemplateMutation';
import { CustomTemplate } from '../types';

import { StackFromCustomTemplateFormWidget } from './StackFromCustomTemplateFormWidget';
import { CustomTemplatesList } from './CustomTemplatesList';
import { useViewParams } from './useViewParams';

export function ListView() {
  const { t } = useTranslation();
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
      <PageHeader title={t('portainer.templates.custom.title')} breadcrumbs={t('portainer.templates.custom.breadcrumb')} />

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
      !(await confirmDelete(t('portainer.templates.custom.delete_confirm')))
    ) {
      return;
    }

    deleteMutation.mutate(templateId, {
      onSuccess: () => {
        notifySuccess(i18n.t('common.success'), i18n.t('portainer.templates.custom.delete_success'));
      },
    });
  }
}
