import { useTranslation } from 'react-i18next';

import { PageHeader } from '@@/PageHeader';
import { Widget } from '@@/Widget';

import { CreateEdgeJobForm } from './CreateEdgeJobForm';

export function CreateView() {
  const { t } = useTranslation();

  return (
    <>
      <PageHeader
        title={t('edge.jobs_create')}
        breadcrumbs={[
          { label: t('edge.jobs_title'), link: 'edge.jobs' },
          t('edge.jobs_create'),
        ]}
      />

      <div className="row">
        <div className="col-sm-12">
          <Widget>
            <Widget.Body>
              <CreateEdgeJobForm />
            </Widget.Body>
          </Widget>
        </div>
      </div>
    </>
  );
}
