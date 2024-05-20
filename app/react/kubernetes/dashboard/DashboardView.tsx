import { Box, Database, FileCode, Layers, Lock, Shuffle } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';
import Route from '@/assets/ico/route.svg?c';

import { DashboardGrid } from '@@/DashboardItem/DashboardGrid';
import { DashboardItem } from '@@/DashboardItem/DashboardItem';
import { PageHeader } from '@@/PageHeader';

import { EnvironmentInfo } from './EnvironmentInfo';
import { useGetDashboardQuery } from './queries/getDashboardQuery';

export function DashboardView() {
  const queryClient = useQueryClient();
  const environmentId = useEnvironmentId();
  const dashboardQuery = useGetDashboardQuery(environmentId);

  const dashboard = dashboardQuery.data;

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
            isLoading={dashboardQuery.isLoading}
            isRefetching={dashboardQuery.isRefetching}
            icon={Layers}
            to="kubernetes.resourcePools"
            type="Namespace"
            data-cy="dashboard-namespace"
          />
          <DashboardItem
            value={dashboard?.applicationsCount}
            isLoading={dashboardQuery.isLoading}
            isRefetching={dashboardQuery.isLoading}
            icon={Box}
            to="kubernetes.applications"
            type="Application"
            data-cy="dashboard-application"
          />
          <DashboardItem
            value={dashboard?.servicesCount}
            isLoading={dashboardQuery.isLoading}
            isRefetching={dashboardQuery.isLoading}
            icon={Shuffle}
            to="kubernetes.services"
            type="Service"
            data-cy="dashboard-service"
          />
          <DashboardItem
            value={dashboard?.ingressesCount}
            isLoading={dashboardQuery.isLoading}
            isRefetching={dashboardQuery.isLoading}
            icon={Route}
            to="kubernetes.ingresses"
            type="Ingress"
            pluralType="Ingresses"
            data-cy="dashboard-ingress"
          />
          <DashboardItem
            value={dashboard?.configMapsCount}
            isLoading={dashboardQuery.isLoading}
            isRefetching={dashboardQuery.isLoading}
            icon={FileCode}
            to="kubernetes.configurations"
            params={{ tab: 'configmaps' }}
            type="ConfigMap"
            data-cy="dashboard-configmaps"
          />
          <DashboardItem
            value={dashboard?.secretsCount}
            isLoading={dashboardQuery.isLoading}
            isRefetching={dashboardQuery.isLoading}
            icon={Lock}
            to="kubernetes.configurations"
            params={{ tab: 'secrets' }}
            type="Secret"
            data-cy="dashboard-secrets"
          />
          <DashboardItem
            value={dashboard?.volumesCount}
            isLoading={dashboardQuery.isLoading}
            isRefetching={dashboardQuery.isLoading}
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
