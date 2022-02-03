import { useEnvironmentId } from '@/portainer/hooks/useEnvironmentId';
import { PageHeader } from '@/portainer/components/PageHeader';
import { error as notifyError } from '@/portainer/services/notifications';
import { r2a } from '@/react-tools/react2angular';

import { aggregateResourceGroups } from '../utils';
import { useResourceGroups, useSubscriptions } from '../queries';

import { DashboardItem } from './DashboardItem';

export function DashboardView() {
  const environmentId = useEnvironmentId();

  const {
    data: subscriptions,
    isLoading: isLoadingSubscriptions,
    error: subscriptionsError,
    isError: isErrorSubscriptions,
  } = useSubscriptions(environmentId);
  if (isErrorSubscriptions) {
    notifyError(
      'Failure',
      subscriptionsError as Error,
      'Unable to retrieve subscriptions'
    );
  }

  const {
    resourceGroups,
    isLoading: isLoadingResourceGroups,
    error: resourceGroupsError,
    isError: isErrorResourceGroups,
  } = useResourceGroups(environmentId, subscriptions);
  if (isErrorResourceGroups) {
    notifyError(
      'Failure',
      resourceGroupsError as Error,
      'Unable to retrieve resource groups'
    );
  }

  const isLoading = isLoadingSubscriptions || isLoadingResourceGroups;
  if (isLoading) {
    return null;
  }

  return (
    <>
      <PageHeader title="Home" breadcrumbs={[{ label: 'Dashboard' }]} />

      {subscriptions && (
        <div className="row">
          <DashboardItem
            value={subscriptions.length}
            icon="fa fa-th-list"
            comment="Subscriptions"
          />
          {!isErrorResourceGroups && (
            <DashboardItem
              value={aggregateResourceGroups(resourceGroups).length}
              icon="fa fa-th-list"
              comment="Resource groups"
            />
          )}
        </div>
      )}
    </>
  );
}

export const DashboardViewAngular = r2a(DashboardView, []);
