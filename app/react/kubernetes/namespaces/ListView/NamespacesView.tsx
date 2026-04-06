import { useTranslation } from 'react-i18next';

import { PageHeader } from '@@/PageHeader';

import { NamespacesDatatable } from './NamespacesDatatable';

export function NamespacesView() {
  const { t } = useTranslation();
  return (
    <>
      <PageHeader title={t('kubernetes.namespaces.list.title')} breadcrumbs={t('kubernetes.namespaces.list.breadcrumbs')} reload />
      <NamespacesDatatable />
    </>
  );
}
