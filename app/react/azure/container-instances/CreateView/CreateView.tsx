import { useTranslation } from 'react-i18next';

import { PageHeader } from '@@/PageHeader';
import { Widget, WidgetBody } from '@@/Widget';

import { CreateContainerInstanceForm } from './CreateContainerInstanceForm';

export function CreateView() {
  const { t } = useTranslation();
  return (
    <>
      <PageHeader
        title={t('azure_containers.create_title')}
        breadcrumbs={[
          { link: 'azure.containerinstances', label: t('azure_containers.container_instances') },
          { label: t('azure_containers.add_container') },
        ]}
        reload
      />

      <div className="row">
        <div className="col-sm-12">
          <Widget>
            <WidgetBody>
              <CreateContainerInstanceForm />
            </WidgetBody>
          </Widget>
        </div>
      </div>
    </>
  );
}
