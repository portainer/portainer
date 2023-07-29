import { PageHeader } from '@@/PageHeader';

import { EdgeStacksDatatable } from './EdgeStacksDatatable';

export function ListView() {
  return (
    <>
      <PageHeader title="Edge Stacks list" breadcrumbs="Edge Stacks" reload />

      <EdgeStacksDatatable />
    </>
  );
}
