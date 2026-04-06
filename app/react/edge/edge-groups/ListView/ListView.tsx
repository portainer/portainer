import { useTranslation } from 'react-i18next';

import { PageHeader } from '@@/PageHeader';

import { EdgeGroupsDatatable } from './EdgeGroupsDatatable';

export function ListView() {
  const { t } = useTranslation();

  return (
    <>
      <PageHeader title={t('edge.groups.title')} breadcrumbs={t('edge.groups.title')} reload />
      <EdgeGroupsDatatable />
    </>
  );
}
