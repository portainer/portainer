import { useStore } from 'zustand';
import { useCurrentStateAndParams, useRouter } from '@uirouter/react';
import { useEffect, useState } from 'react';

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

  useEffect(() => {
    async function redirect() {
      const options = {
        title: `Failed connecting to ${params.environmentName}`,
        message: `There was an issue connecting to edge agent via tunnel. Click 'Retry' below to retry now, or wait 10 seconds to automatically retry.`,
        confirmButton: buildConfirmButton('Retry', 'primary', 10),
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
        title="Home"
        breadcrumbs={[{ label: 'Environments' }]}
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

  function handleBrowseClick(environment: Environment) {
    if (isEdgeEnvironment(environment.Type)) {
      setConnectingToEdgeEndpoint(true);
    }
  }
}
