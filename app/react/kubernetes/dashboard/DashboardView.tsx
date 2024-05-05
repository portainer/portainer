import { Box, Database, FileCode, Layers, Lock, Shuffle } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';
import Route from '@/assets/ico/route.svg?c';

import { DashboardGrid } from '@@/DashboardItem/DashboardGrid';
import { DashboardItem } from '@@/DashboardItem/DashboardItem';
import { PageHeader } from '@@/PageHeader';

import { useApplicationsQuery } from '../applications/application.queries';
import { usePVCsQuery } from '../volumes/usePVCsQuery';
import { useServicesForCluster } from '../services/service';
import { useIngresses } from '../ingresses/queries';
import { useConfigMapsForCluster } from '../configs/configmap.service';
import { useSecretsForCluster } from '../configs/secret.service';
import { useNamespacesQuery } from '../namespaces/queries/useNamespacesQuery';

import { EnvironmentInfo } from './EnvironmentInfo';

export function DashboardView() {
  const queryClient = useQueryClient();
  const environmentId = useEnvironmentId();
  const { data: namespaces, ...namespacesQuery } =
    useNamespacesQuery(environmentId);
  const namespaceNames = namespaces && Object.keys(namespaces);
  const { data: applications, ...applicationsQuery } = useApplicationsQuery(
    environmentId,
    namespaceNames
  );
  const { data: pvcs, ...pvcsQuery } = usePVCsQuery(
    environmentId,
    namespaceNames
  );
  const { data: services, ...servicesQuery } = useServicesForCluster(
    environmentId,
    namespaceNames,
    { lookupApplications: false }
  );
  const { data: ingresses, ...ingressesQuery } = useIngresses(
    environmentId,
    namespaceNames
  );
  const { data: configMaps, ...configMapsQuery } = useConfigMapsForCluster(
    environmentId,
    namespaceNames
  );
  const { data: secrets, ...secretsQuery } = useSecretsForCluster(
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
            data-cy="dashboard-namespace"
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
            data-cy="dashboard-application"
          />
          <DashboardItem
            value={services?.length}
            isLoading={servicesQuery.isLoading || namespacesQuery.isLoading}
            isRefetching={
              servicesQuery.isRefetching || namespacesQuery.isRefetching
            }
            icon={Shuffle}
            to="kubernetes.services"
            type="Service"
            data-cy="dashboard-service"
          />
          <DashboardItem
            value={ingresses?.length}
            isLoading={ingressesQuery.isLoading || namespacesQuery.isLoading}
            isRefetching={
              ingressesQuery.isRefetching || namespacesQuery.isRefetching
            }
            icon={Route}
            to="kubernetes.ingresses"
            type="Ingress"
            pluralType="Ingresses"
            data-cy="dashboard-ingress"
          />
          <DashboardItem
            value={configMaps?.length}
            isLoading={configMapsQuery.isLoading || namespacesQuery.isLoading}
            isRefetching={
              configMapsQuery.isRefetching || namespacesQuery.isRefetching
            }
            icon={FileCode}
            to="kubernetes.configurations"
            params={{ tab: 'configmaps' }}
            type="ConfigMap"
            data-cy="dashboard-configmaps"
          />
          <DashboardItem
            value={secrets?.length}
            isLoading={secretsQuery.isLoading || namespacesQuery.isLoading}
            isRefetching={
              secretsQuery.isRefetching || namespacesQuery.isRefetching
            }
            icon={Lock}
            to="kubernetes.configurations"
            params={{ tab: 'secrets' }}
            type="Secret"
            data-cy="dashboard-secrets"
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
            data-cy="dashboard-volume"
          />
        </DashboardGrid>
      </div>
    </>
  );
}
