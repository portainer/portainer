import { PageHeader } from '@@/PageHeader';

import { IngressDatatable } from './IngressDatatable';

export function IngressesDatatableView() {
  return (
    <>
      <PageHeader
        title="Ingresses"
        breadcrumbs={[
          {
            label: 'Ingresses',
          },
        ]}
        reload
      />
      <IngressDatatable />
    </>
  );
}
