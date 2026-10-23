import { PageHeader } from '@@/PageHeader';

import { useDeleteNetworkListMutation } from '../queries/useDeleteNetworkListMutation';

import { NetworksDatatable } from './NetworksDatatable';

export function ListView() {
  const removeMutation = useDeleteNetworkListMutation();

  return (
    <>
      <PageHeader title="Network List" breadcrumbs={['Networks']} reload />

      <NetworksDatatable
        onRemove={(networks) => removeMutation.mutate({ networks })}
      />
    </>
  );
}
