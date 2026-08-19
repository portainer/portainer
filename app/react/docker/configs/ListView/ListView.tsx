import { PageHeader } from '@@/PageHeader';

import { ConfigsDatatable } from './ConfigsDatatable/ConfigsDatatable';

export function ListView() {
  return (
    <>
      <PageHeader title="Configs list" breadcrumbs="Configs" reload />

      <ConfigsDatatable />
    </>
  );
}
