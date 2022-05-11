import { useRouter } from '@uirouter/react';
import { useState } from 'react';

import { r2a } from '@/react-tools/react2angular';

import { PageHeader } from '../components/PageHeader';
import * as notifications from '../services/notifications';
import { Environment } from '../environments/types';
import { snapshotEndpoints } from '../environments/environment.service';
import { isEdgeEnvironment } from '../environments/utils';
import { confirmAsync } from '../services/modal.service/confirm';

import { EnvironmentList } from './EnvironmentList';
import { EdgeLoadingSpinner } from './EdgeLoadingSpinner';
import { MotdPanel } from './MotdPanel';
import { LicenseNodePanel } from './LicenseNodePanel';
import { BackupFailedPanel } from './BackupFailedPanel';

export function HomeView() {
  const [connectingToEdgeEndpoint, setConnectingToEdgeEndpoint] =
    useState(false);

  const router = useRouter();
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
          onClickItem={handleClickItem}
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

  function handleClickItem(environment: Environment) {
    if (isEdgeEnvironment(environment.Type)) {
      setConnectingToEdgeEndpoint(true);
    }
  }
}

export const HomeViewAngular = r2a(HomeView, []);

async function confirmEndpointSnapshot() {
  return confirmAsync({
    title: 'Are you sure?',
    message:
      'Triggering a manual refresh will poll each environment to retrieve its information, this may take a few moments.',
    buttons: {
      confirm: {
        label: 'Continue',
        className: 'btn-primary',
      },
    },
  });
}
