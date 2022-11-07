import { PageHeader } from '@@/PageHeader';

import { IngressDataTable } from './IngressDataTable';

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
      <IngressDataTable />
    </>
  );
}
