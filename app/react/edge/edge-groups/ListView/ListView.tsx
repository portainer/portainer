import { PageHeader } from '@@/PageHeader';

import { EdgeGroupsDatatable } from './EdgeGroupsDatatable';

export function ListView() {
  return (
    <>
      <PageHeader title="Edge Groups" breadcrumbs="Edge Groups" reload />
      <EdgeGroupsDatatable />
    </>
  );
}
