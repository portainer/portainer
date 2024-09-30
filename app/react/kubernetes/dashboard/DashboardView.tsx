import { Box, Database, FileCode, Layers, Lock, Shuffle } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';
import Route from '@/assets/ico/route.svg?c';

import { DashboardGrid } from '@@/DashboardItem/DashboardGrid';
import { DashboardItem } from '@@/DashboardItem/DashboardItem';
import { PageHeader } from '@@/PageHeader';

import { EnvironmentInfo } from './EnvironmentInfo';
import { useGetApplicationsCountQuery } from './queries/getApplicationsCountQuery';
import { useGetConfigMapsCountQuery } from './queries/getConfigMapsCountQuery';
import { useGetIngressesCountQuery } from './queries/getIngressesCountQuery';
import { useGetSecretsCountQuery } from './queries/getSecretsCountQuery';
import { useGetServicesCountQuery } from './queries/getServicesCountQuery';
import { useGetVolumesCountQuery } from './queries/getVolumesCountQuery';
import { useGetNamespacesCountQuery } from './queries/getNamespacesCountQuery';

export function DashboardView() {
  const queryClient = useQueryClient();
  const environmentId = useEnvironmentId();

  const applicationsCountQuery = useGetApplicationsCountQuery(environmentId);
  const configMapsCountQuery = useGetConfigMapsCountQuery(environmentId);
  const ingressesCountQuery = useGetIngressesCountQuery(environmentId);
  const secretsCountQuery = useGetSecretsCountQuery(environmentId);
  const servicesCountQuery = useGetServicesCountQuery(environmentId);
  const volumesCountQuery = useGetVolumesCountQuery(environmentId);
  const namespacesCountQuery = useGetNamespacesCountQuery(environmentId);

  const dashboard = {
    applicationsCount: applicationsCountQuery.data,
    configMapsCount: configMapsCountQuery.data,
    ingressesCount: ingressesCountQuery.data,
    secretsCount: secretsCountQuery.data,
    servicesCount: servicesCountQuery.data,
    volumesCount: volumesCountQuery.data,
    namespacesCount: namespacesCountQuery.data,
  };

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
            value={dashboard?.namespacesCount}
            isLoading={namespacesCountQuery.isInitialLoading}
            isRefetching={namespacesCountQuery.isRefetching}
            icon={Layers}
            to="kubernetes.resourcePools"
            type="Namespace"
            data-cy="dashboard-namespace"
          />
          <DashboardItem
            value={dashboard?.applicationsCount}
            isLoading={applicationsCountQuery.isInitialLoading}
            isRefetching={applicationsCountQuery.isRefetching}
            icon={Box}
            to="kubernetes.applications"
            type="Application"
            data-cy="dashboard-application"
          />
          <DashboardItem
            value={dashboard?.servicesCount}
            isLoading={servicesCountQuery.isInitialLoading}
            isRefetching={servicesCountQuery.isRefetching}
            icon={Shuffle}
            to="kubernetes.services"
            type="Service"
            data-cy="dashboard-service"
          />
          <DashboardItem
            value={dashboard?.ingressesCount}
            isLoading={ingressesCountQuery.isInitialLoading}
            isRefetching={ingressesCountQuery.isRefetching}
            icon={Route}
            to="kubernetes.ingresses"
            type="Ingress"
            pluralType="Ingresses"
            data-cy="dashboard-ingress"
          />
          <DashboardItem
            value={dashboard?.configMapsCount}
            isLoading={configMapsCountQuery.isInitialLoading}
            isRefetching={configMapsCountQuery.isRefetching}
            icon={FileCode}
            to="kubernetes.configurations"
            params={{ tab: 'configmaps' }}
            type="ConfigMap"
            data-cy="dashboard-configmaps"
          />
          <DashboardItem
            value={dashboard?.secretsCount}
            isLoading={secretsCountQuery.isInitialLoading}
            isRefetching={secretsCountQuery.isRefetching}
            icon={Lock}
            to="kubernetes.configurations"
            params={{ tab: 'secrets' }}
            type="Secret"
            data-cy="dashboard-secrets"
          />
          <DashboardItem
            value={dashboard?.volumesCount}
            isLoading={volumesCountQuery.isInitialLoading}
            isRefetching={volumesCountQuery.isRefetching}
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
