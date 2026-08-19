import { useCurrentEnvironment } from '@/react/hooks/useCurrentEnvironment';
import { PageHeader } from '@/react/components/PageHeader';
import { NodesDatatable } from '@/react/kubernetes/cluster/HomeView/NodesDatatable';

import { ClusterResourceReservation } from './ClusterResourceReservation';

export function ClusterView() {
  const { data: environment } = useCurrentEnvironment();

  return (
    <>
      <PageHeader
        title="Cluster"
        breadcrumbs={[
          { label: 'Environments', link: 'portainer.endpoints' },
          {
            label: environment?.Name || '',
            link: 'portainer.endpoints.endpoint',
            linkParams: { id: environment?.Id },
          },
          'Cluster information',
        ]}
        reload
      />

      <ClusterResourceReservation />

      <div className="row">
        <NodesDatatable />
      </div>
    </>
  );
}
