import { PageHeader } from '@@/PageHeader';

import { NamespacesDatatable } from './NamespacesDatatable';

export function NamespacesView() {
  return (
    <>
      <PageHeader title="Namespace list" breadcrumbs="Namespaces" reload />
      <NamespacesDatatable />
    </>
  );
}
