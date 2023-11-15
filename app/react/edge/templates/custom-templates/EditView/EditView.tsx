import { useCurrentStateAndParams, useRouter } from '@uirouter/react';
import { useEffect } from 'react';

import { useCustomTemplate } from '@/react/portainer/templates/custom-templates/queries/useCustomTemplate';
import { notifyError } from '@/portainer/services/notifications';

import { PageHeader } from '@@/PageHeader';
import { Widget } from '@@/Widget';

import { EditTemplateForm } from './EditTemplateForm';

export function EditView() {
  const router = useRouter();
  const {
    params: { id },
  } = useCurrentStateAndParams();
  const customTemplateQuery = useCustomTemplate(id);

  useEffect(() => {
    if (customTemplateQuery.data && !customTemplateQuery.data.EdgeTemplate) {
      notifyError('Error', new Error('Trying to load non edge template'));
      router.stateService.go('^');
    }
  }, [customTemplateQuery.data, router.stateService]);

  if (!customTemplateQuery.data) {
    return null;
  }

  const template = customTemplateQuery.data;

  return (
    <>
      <PageHeader
        title="Edit Custom Template"
        breadcrumbs={[{ label: 'Custom templates', link: '^' }, template.Title]}
      />
      <div className="row">
        <div className="col-sm-12">
          <Widget>
            <Widget.Body>
              <EditTemplateForm template={template} />
            </Widget.Body>
          </Widget>
        </div>
      </div>
    </>
  );
}
