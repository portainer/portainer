import { PageHeader } from '@@/PageHeader';

import { IngressDatatable } from './IngressDatatable';

export function IngressesDatatableView() {
  return (
    <>
      <PageHeader
        title="Ingress list"
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
