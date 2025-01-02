import {
  BoxIcon,
  CpuIcon,
  DatabaseIcon,
  LayersIcon,
  ListIcon,
  NetworkIcon,
  ShuffleIcon,
} from 'lucide-react';

import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';
import { isAgentEnvironment } from '@/react/portainer/environments/utils';
import { useCurrentEnvironment } from '@/react/hooks/useCurrentEnvironment';
import { useIsEnvironmentAdmin } from '@/react/hooks/useUser';

import { PageHeader } from '@@/PageHeader';
import { DashboardGrid } from '@@/DashboardItem/DashboardGrid';
import { DashboardItem } from '@@/DashboardItem';

import { useIsSwarm, useIsSwarmManager } from '../proxy/queries/useInfo';

import { NonAgentSwarmInfo } from './NonAgentSwarmInfo';
import { ClusterAgentInfo } from './ClusterAgentInfo';
import { EnvironmentInfo } from './EnvironmentInfo';
import { ContainerStatus } from './ContainerStatus';
import { ImagesTotalSize } from './ImagesTotalSize';
import { useDashboard } from './useDashboard';

export function DashboardView() {
  const envId = useEnvironmentId();
  const envQuery = useCurrentEnvironment();
  const isEnvAdminQuery = useIsEnvironmentAdmin();
  const isSwarmManager = useIsSwarmManager(envId);
  const isStandalone = useIsSwarm(envId);
  const dashboardStatsQuery = useDashboard(envId);

  if (!envQuery.data || !dashboardStatsQuery.data) {
    return null;
  }

  const env = envQuery.data;
  const isStacksVisible = shouldShowStacks();
  const dashboardStats = dashboardStatsQuery.data;

  return (
    <>
      <PageHeader title="Dashboard" breadcrumbs="Environment summary" reload />

      <div className="mx-4 space-y-6">
        <InfoPanels isAgent={isAgentEnvironment(env.Type)} />

        <DashboardGrid>
          {isStacksVisible && (
            <DashboardItem
              to="docker.stacks"
              icon={LayersIcon}
              type="Stack"
              value={dashboardStats.stacks}
              data-cy="stacks"
            />
          )}

          {isSwarmManager && (
            <DashboardItem
              to="docker.services"
              icon={ShuffleIcon}
              type="Service"
              value={dashboardStats.services}
              data-cy="services"
            />
          )}

          <DashboardItem
            to="docker.containers"
            icon={BoxIcon}
            type="Container"
            value={dashboardStats.containers.total}
            data-cy="containers"
          >
            <ContainerStatus stats={dashboardStats.containers} />
          </DashboardItem>

          <DashboardItem
            to="docker.images"
            icon={ListIcon}
            type="Image"
            value={dashboardStats.images.total}
            data-cy="images"
          >
            <ImagesTotalSize imagesTotalSize={dashboardStats.images.size} />
          </DashboardItem>

          <DashboardItem
            to="docker.volumes"
            icon={DatabaseIcon}
            type="Volume"
            value={dashboardStats.volumes}
            data-cy="volumes"
          />

          <DashboardItem
            to="docker.networks"
            icon={NetworkIcon}
            type="Network"
            value={dashboardStats.networks}
            data-cy="networks"
          />

          {env.EnableGPUManagement && isStandalone && (
            <DashboardItem
              icon={CpuIcon}
              type="GPU"
              value={env.Gpus?.length}
              data-cy="gpus"
            />
          )}
        </DashboardGrid>
      </div>

      <div className="pt-6" />
    </>
  );

  function shouldShowStacks() {
    return (
      env.SecuritySettings.allowStackManagementForRegularUsers ||
      isEnvAdminQuery.authorized
    );
  }
}

function InfoPanels({ isAgent }: { isAgent: boolean }) {
  const envId = useEnvironmentId();
  const isSwarm = useIsSwarm(envId);

  return (
    <>
      {isSwarm && !isAgent && <NonAgentSwarmInfo />}
      {isSwarm && isAgent && <ClusterAgentInfo />}
      {(!isSwarm || !isAgent) && <EnvironmentInfo />}
    </>
  );
}
