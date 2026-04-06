import { useTranslation } from 'react-i18next';

import { PageHeader } from '@@/PageHeader';

import { ConfigsDatatable } from './ConfigsDatatable/ConfigsDatatable';

export function ListView() {
  const { t } = useTranslation();

  return (
    <>
      <PageHeader title={t('docker.configs.list.title')} breadcrumbs={t('docker.configs.list.breadcrumb')} reload />

      <ConfigsDatatable />
    </>
  );
}
