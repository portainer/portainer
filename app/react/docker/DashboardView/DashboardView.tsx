import {
  BoxIcon,
  CpuIcon,
  DatabaseIcon,
  LayersIcon,
  ListIcon,
  NetworkIcon,
  ShuffleIcon,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();
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
      <PageHeader title={t('docker.dashboard.title')} breadcrumbs={t('docker.dashboard.environmentSummary')} reload />

      <div className="mx-4 space-y-6">
        <InfoPanels isAgent={isAgentEnvironment(env.Type)} />

        <DashboardGrid>
          {isStacksVisible && (
            <DashboardItem
              to="docker.stacks"
              icon={LayersIcon}
              type={t('docker.dashboard.stack')}
              value={dashboardStats.stacks}
              data-cy="stacks"
            />
          )}

          {isSwarmManager && (
            <DashboardItem
              to="docker.services"
              icon={ShuffleIcon}
              type={t('docker.dashboard.service')}
              value={dashboardStats.services}
              data-cy="services"
            />
          )}

          <DashboardItem
            to="docker.containers"
            icon={BoxIcon}
            type={t('docker.dashboard.container')}
            value={dashboardStats.containers.total}
            data-cy="containers"
          >
            <ContainerStatus stats={dashboardStats.containers} />
          </DashboardItem>

          <DashboardItem
            to="docker.images"
            icon={ListIcon}
            type={t('docker.dashboard.image')}
            value={dashboardStats.images.total}
            data-cy="images"
          >
            <ImagesTotalSize imagesTotalSize={dashboardStats.images.size} />
          </DashboardItem>

          <DashboardItem
            to="docker.volumes"
            icon={DatabaseIcon}
            type={t('docker.dashboard.volume')}
            value={dashboardStats.volumes}
            data-cy="volumes"
          />

          <DashboardItem
            to="docker.networks"
            icon={NetworkIcon}
            type={t('docker.dashboard.network')}
            value={dashboardStats.networks}
            data-cy="networks"
          />

          {env.EnableGPUManagement && isStandalone && (
            <DashboardItem
              icon={CpuIcon}
              type={t('docker.dashboard.gpu')}
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
