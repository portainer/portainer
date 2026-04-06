import { useTranslation } from 'react-i18next';

import { PageHeader } from '@@/PageHeader';

import { EnvironmentGroupsDatatable } from './EnvironmentGroupsDatatable';

export function ListView() {
  const { t } = useTranslation();

  return (
    <>
      <PageHeader
        title={t('groups.title')}
        breadcrumbs={t('groups.breadcrumbs')}
        reload
      />

      <EnvironmentGroupsDatatable />
    </>
  );
}
