import { useQueryClient } from 'react-query';

import { PageHeader } from '@@/PageHeader';

import { queryKeys } from '../queries/query-keys';

import { EdgeStacksDatatable } from './EdgeStacksDatatable';

export function ListView() {
  const queryClient = useQueryClient();

  return (
    <>
      <PageHeader
        title="Edge Stacks list"
        breadcrumbs="Edge Stacks"
        reload
        onReload={() => queryClient.invalidateQueries(queryKeys.base())}
      />

      <EdgeStacksDatatable />
    </>
  );
}
