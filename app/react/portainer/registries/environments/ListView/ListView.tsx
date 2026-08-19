import { PageHeader } from '@@/PageHeader';

import { EnvironmentRegistriesDatatable } from './EnvironmentRegistriesDatatable';

export function ListView() {
  return (
    <>
      <PageHeader
        title="Environment registries"
        breadcrumbs="Registry management"
        reload
      />

      <EnvironmentRegistriesDatatable />
    </>
  );
}
