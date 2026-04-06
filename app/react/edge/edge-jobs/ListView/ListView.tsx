import { useTranslation } from 'react-i18next';

import { InformationPanel } from '@@/InformationPanel';
import { PageHeader } from '@@/PageHeader';

import { EdgeJobsDatatable } from './EdgeJobsDatatable';

export function ListView() {
  const { t } = useTranslation();

  return (
    <>
      <PageHeader title={t('edge.jobs.list.title')} breadcrumbs={t('edge.jobs.list.breadcrumbs')} reload />

      <div className="row">
        <div className="col-sm-12">
          <InformationPanel title={t('edge.jobs.list.information_title')}>
            <p className="small text-muted">
              {t('edge.jobs.list.information_message')}
            </p>
          </InformationPanel>
        </div>
      </div>

      <EdgeJobsDatatable />
    </>
  );
}
