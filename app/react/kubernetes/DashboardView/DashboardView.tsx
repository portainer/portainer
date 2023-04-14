import { Box, Database, Layers, Lock } from 'lucide-react';
import { useQueryClient } from 'react-query';

import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';

import { DashboardGrid } from '@@/DashboardItem/DashboardGrid';
import { DashboardItem } from '@@/DashboardItem/DashboardItem';
import { PageHeader } from '@@/PageHeader';

import { useNamespaces } from '../namespaces/queries';
import { useApplicationsForCluster } from '../applications/application.queries';
import { useConfigurationsForCluster } from '../configs/queries';
import { usePVCsForCluster } from '../volumes/queries';

import { EnvironmentInfo } from './EnvironmentInfo';

export function DashboardView() {
  const queryClient = useQueryClient();
  const environmentId = useEnvironmentId();
  const { data: namespaces, ...namespacesQuery } = useNamespaces(environmentId);
  const namespaceNames = namespaces && Object.keys(namespaces);
  const { data: applications, ...applicationsQuery } =
    useApplicationsForCluster(environmentId, namespaceNames);
  const { data: configurations, ...configurationsQuery } =
    useConfigurationsForCluster(environmentId, namespaceNames);
  const { data: pvcs, ...pvcsQuery } = usePVCsForCluster(
    environmentId,
    namespaceNames
  );

  return (
    <>
      <PageHeader
        title="Dashboard"
        breadcrumbs={[{ label: 'Environment summary' }]}
        reload
        onReload={() =>
          queryClient.invalidateQueries(['environments', environmentId])
        }
      />
      <div className="col-sm-12 flex flex-col gap-y-5">
        <EnvironmentInfo />
        <DashboardGrid>
          <DashboardItem
            value={namespaceNames?.length}
            isLoading={namespacesQuery.isLoading}
            isRefetching={namespacesQuery.isRefetching}
            icon={Layers}
            to="kubernetes.resourcePools"
            type="Namespace"
            dataCy="dashboard-namespace"
          />
          <DashboardItem
            value={applications?.length}
            isLoading={applicationsQuery.isLoading || namespacesQuery.isLoading}
            isRefetching={
              applicationsQuery.isRefetching || namespacesQuery.isRefetching
            }
            icon={Box}
            to="kubernetes.applications"
            type="Application"
            dataCy="dashboard-application"
          />
          <DashboardItem
            value={configurations?.length}
            isLoading={
              configurationsQuery.isLoading || namespacesQuery.isLoading
            }
            isRefetching={
              configurationsQuery.isRefetching || namespacesQuery.isRefetching
            }
            icon={Lock}
            to="kubernetes.configurations"
            type="ConfigMaps & Secrets"
            pluralType="ConfigMaps & Secrets"
            dataCy="dashboard-config"
          />
          <DashboardItem
            value={pvcs?.length}
            isLoading={pvcsQuery.isLoading || namespacesQuery.isLoading}
            isRefetching={
              pvcsQuery.isRefetching || namespacesQuery.isRefetching
            }
            icon={Database}
            to="kubernetes.volumes"
            type="Volume"
            dataCy="dashboard-volume"
          />
        </DashboardGrid>
      </div>
    </>
  );
}
