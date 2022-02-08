import { useEnvironmentId } from '@/portainer/hooks/useEnvironmentId';
import { PageHeader } from '@/portainer/components/PageHeader';
import { DashboardItem } from '@/portainer/components/DashboardItem';
import { error as notifyError } from '@/portainer/services/notifications';
import PortainerError from '@/portainer/error';
import { r2a } from '@/react-tools/react2angular';

import { useResourceGroups, useSubscriptions } from '../queries';

export function DashboardView() {
  const environmentId = useEnvironmentId();

  const subscriptionsQuery = useSubscriptions(environmentId);
  if (subscriptionsQuery.isError) {
    notifyError(
      'Failure',
      subscriptionsQuery.error as PortainerError,
      'Unable to retrieve subscriptions'
    );
  }

  const resourceGroupsQuery = useResourceGroups(
    environmentId,
    subscriptionsQuery.data
  );
  if (resourceGroupsQuery.isError && resourceGroupsQuery.queryErrors) {
    resourceGroupsQuery.queryErrors.forEach((e) =>
      notifyError(
        'Failure',
        e.error as PortainerError,
        `Unable to retrieve resource groups for ${e.subscriptionId} resource group`
      )
    );
  }

  const isLoading =
    subscriptionsQuery.isLoading || resourceGroupsQuery.isLoading;
  if (isLoading) {
    return null;
  }

  return (
    <>
      <PageHeader title="Home" breadcrumbs={[{ label: 'Dashboard' }]} />

      {subscriptionsQuery.data && (
        <div className="row">
          <DashboardItem
            value={subscriptionsQuery.data.length}
            icon="fa fa-th-list"
            comment="Subscriptions"
          />
          {!resourceGroupsQuery.isError && (
            <DashboardItem
              value={
                Object.values(resourceGroupsQuery.resourceGroups).flatMap((x) =>
                  Object.values(x)
                ).length
              }
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
