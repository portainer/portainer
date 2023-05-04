import { PageHeader } from '@@/PageHeader';

import { ServicesDatatable } from './ServicesDatatable';

export function ServicesView() {
  return (
    <>
      <PageHeader title="Service List" breadcrumbs="Services" reload />
      <ServicesDatatable />
    </>
  );
}
