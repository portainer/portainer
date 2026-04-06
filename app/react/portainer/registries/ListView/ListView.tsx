import { useTranslation } from 'react-i18next';

import { PageHeader } from '@@/PageHeader';
import { InformationPanel } from '@@/InformationPanel';

import { RegistriesDatatable } from './RegistriesDatatable';

export function ListView() {
  const { t } = useTranslation();

  return (
    <>
      <PageHeader title={t('registries.title')} breadcrumbs={t('registries.breadcrumbs')} reload />

      <div className="row">
        <div className="col-sm-12">
          <InformationPanel title={t('registries.information_title')}>
            <span className="small text-muted">
              {t('registries.information_message')}
            </span>
          </InformationPanel>
        </div>
      </div>

      <RegistriesDatatable />
    </>
  );
}
