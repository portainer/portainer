import { useUnauthorizedRedirect } from '@/react/hooks/useUnauthorizedRedirect';

import { PageHeader } from '@@/PageHeader';

import { ServiceAccountsDatatable } from './ServiceAccountsDatatable';

export function ServiceAccountsView() {
  useUnauthorizedRedirect(
    { authorizations: ['K8sServiceAccountsW'], adminOnlyCE: true },
    { to: 'kubernetes.dashboard' }
  );
  return (
    <>
      <PageHeader
        title="Service Account list"
        breadcrumbs="Service Accounts"
        reload
      />
      <ServiceAccountsDatatable />
    </>
  );
}
