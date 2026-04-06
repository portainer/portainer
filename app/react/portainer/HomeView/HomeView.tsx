import { useStore } from 'zustand';
import { useCurrentStateAndParams, useRouter } from '@uirouter/react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { environmentStore } from '@/react/hooks/current-environment-store';
import { Environment } from '@/react/portainer/environments/types';
import { isEdgeEnvironment } from '@/react/portainer/environments/utils';

import { confirm } from '@@/modals/confirm';
import { PageHeader } from '@@/PageHeader';
import { ModalType } from '@@/modals';
import { buildConfirmButton } from '@@/modals/utils';

import { EnvironmentList } from './EnvironmentList';
import { EdgeLoadingSpinner } from './EdgeLoadingSpinner';
import { MotdPanel } from './MotdPanel';
import { LicenseNodePanel } from './LicenseNodePanel';
import { BackupFailedPanel } from './BackupFailedPanel';
import {
  EnvironmentHeader,
  HeaderFilter,
} from './EnvironmentHeader/EnvironmentHeader';
import { useHomePageFilter } from './EnvironmentList/HomepageFilter';

export function HomeView() {
  const { clear: clearStore } = useStore(environmentStore);

  const { params } = useCurrentStateAndParams();
  const [connectingToEdgeEndpoint, setConnectingToEdgeEndpoint] = useState(
    !!params.redirect
  );
  const [headerFilter, setHeaderFilter] = useHomePageFilter<HeaderFilter>(
    'headerFilter',
    'all'
  );

  const router = useRouter();
  const { t } = useTranslation();

  useEffect(() => {
    async function redirect() {
      const options = {
        title: t('home.failed_connecting', { name: params.environmentName }),
        message: t('home.edge_tunnel_retry_message'),
        confirmButton: buildConfirmButton(t('common.retry'), 'primary', 10),
        modalType: ModalType.Destructive,
      };

      if (await confirm(options)) {
        setConnectingToEdgeEndpoint(true);
        router.stateService.go(params.route, {
          endpointId: params.environmentId,
        });
      } else {
        clearStore();
        router.stateService.go(
          'portainer.home',
          {},
          { reload: true, inherit: false }
        );
      }
    }

    if (params.redirect) {
      redirect();
    }
  }, [params, setConnectingToEdgeEndpoint, router, clearStore]);

  return (
    <div className="flex min-h-screen flex-col">
      <PageHeader
        reload
        title={t('home.title')}
        breadcrumbs={[{ label: t('home.breadcrumbs_environments') }]}
      />

      {process.env.PORTAINER_EDITION !== 'CE' && <LicenseNodePanel />}

      <MotdPanel />

      {process.env.PORTAINER_EDITION !== 'CE' && <BackupFailedPanel />}

      {connectingToEdgeEndpoint ? (
        <div className="flex flex-1 flex-col items-center justify-center">
          <EdgeLoadingSpinner />
        </div>
      ) : (
        <div className="mx-5 flex flex-col gap-6">
          <EnvironmentHeader
            activeFilter={headerFilter}
            onFilterChange={setHeaderFilter}
          />
          <EnvironmentList
            onClickBrowse={handleBrowseClick}
            headerFilter={headerFilter}
            onHeaderFilterChange={setHeaderFilter}
          />
        </div>
      )}
    </div>
  );

  async function confirmTriggerSnapshot() {
    const result = await confirmEndpointSnapshot();
    if (!result) {
      return;
    }
    try {
      await snapshotEndpoints();
      notifications.success(t('common.success'), t('home.snapshot_success'));
      router.stateService.reload();
    } catch (err) {
      notifications.error(
        t('common.failure'),
        err as Error,
        t('home.snapshot_error')
      );
    }
  }

  async function confirmEndpointSnapshot() {
    return confirm({
      title: t('home.snapshot_confirm_title'),
      modalType: ModalType.Warn,
      message: t('home.snapshot_confirm_message'),
    });
  }

  function handleBrowseClick(environment: Environment) {
    if (isEdgeEnvironment(environment.Type)) {
      setConnectingToEdgeEndpoint(true);
    }
  }
}
