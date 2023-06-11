import { PageHeader } from '@@/PageHeader';

import { ServicesDatatable } from './ServicesDatatable';

export function ServicesView() {
  return (
    <>
      <PageHeader title="Service list" breadcrumbs="Services" reload />
      <ServicesDatatable />
    </>
  );
}
