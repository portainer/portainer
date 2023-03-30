import { useCurrentStateAndParams, useRouter } from '@uirouter/react';
import { useEffect, useState } from 'react';

import { Environment } from '@/react/portainer/environments/types';
import { snapshotEndpoints } from '@/react/portainer/environments/environment.service';
import { isEdgeEnvironment } from '@/react/portainer/environments/utils';
import * as notifications from '@/portainer/services/notifications';

import { confirm } from '@@/modals/confirm';
import { PageHeader } from '@@/PageHeader';
import { ModalType } from '@@/modals';
import { buildConfirmButton } from '@@/modals/utils';

import { EnvironmentList } from './EnvironmentList';
import { EdgeLoadingSpinner } from './EdgeLoadingSpinner';
import { MotdPanel } from './MotdPanel';
import { LicenseNodePanel } from './LicenseNodePanel';
import { BackupFailedPanel } from './BackupFailedPanel';

export function HomeView() {
  const { params } = useCurrentStateAndParams();
  const [connectingToEdgeEndpoint, setConnectingToEdgeEndpoint] = useState(
    !!params.redirect
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
        router.stateService.go('portainer.home', {}, { inherit: false });
      }
    }

    if (params.redirect) {
      redirect();
    }
  }, [params, setConnectingToEdgeEndpoint, router]);

  return (
    <>
      <PageHeader
        reload
        title="Home"
        breadcrumbs={[{ label: 'Environments' }]}
      />

      {process.env.PORTAINER_EDITION !== 'CE' && <LicenseNodePanel />}

      <MotdPanel />

      {process.env.PORTAINER_EDITION !== 'CE' && <BackupFailedPanel />}

      {connectingToEdgeEndpoint ? (
        <EdgeLoadingSpinner />
      ) : (
        <EnvironmentList
          onClickBrowse={handleBrowseClick}
          onRefresh={confirmTriggerSnapshot}
        />
      )}
    </>
  );

  async function confirmTriggerSnapshot() {
    const result = await confirmEndpointSnapshot();
    if (!result) {
      return;
    }
    try {
      await snapshotEndpoints();
      notifications.success('Success', 'Environments updated');
      router.stateService.reload();
    } catch (err) {
      notifications.error(
        'Failure',
        err as Error,
        'An error occurred during environment snapshot'
      );
    }
  }

  function handleBrowseClick(environment: Environment) {
    if (isEdgeEnvironment(environment.Type)) {
      setConnectingToEdgeEndpoint(true);
    }
  }
}

async function confirmEndpointSnapshot() {
  return confirm({
    title: 'Are you sure?',
    modalType: ModalType.Warn,
    message:
      'Triggering a manual refresh will poll each environment to retrieve its information, this may take a few moments.',
  });
}
