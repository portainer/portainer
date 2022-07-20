import { useEffect } from 'react';

import { useEnvironmentId } from '@/portainer/hooks/useEnvironmentId';
import { error as notifyError } from '@/portainer/services/notifications';
import PortainerError from '@/portainer/error';
import { r2a } from '@/react-tools/react2angular';

import { DashboardItem } from '@@/DashboardItem';
import { PageHeader } from '@@/PageHeader';
import { DashboardGrid } from '@@/DashboardItem/DashboardGrid';

import { useResourceGroups, useSubscriptions } from '../queries';

export function DashboardView() {
  const environmentId = useEnvironmentId();

  const subscriptionsQuery = useSubscriptions(environmentId);
  useEffect(() => {
    if (subscriptionsQuery.isError) {
      notifyError(
        'Failure',
        subscriptionsQuery.error as PortainerError,
        'Unable to retrieve subscriptions'
      );
    }
  }, [subscriptionsQuery.error, subscriptionsQuery.isError]);

  const resourceGroupsQuery = useResourceGroups(
    environmentId,
    subscriptionsQuery.data
  );
  useEffect(() => {
    if (resourceGroupsQuery.isError && resourceGroupsQuery.error) {
      notifyError(
        'Failure',
        resourceGroupsQuery.error as PortainerError,
        `Unable to retrieve resource groups`
      );
    }
  }, [resourceGroupsQuery.error, resourceGroupsQuery.isError]);

  const isLoading =
    subscriptionsQuery.isLoading || resourceGroupsQuery.isLoading;
  if (isLoading) {
    return null;
  }

  const subscriptionsCount = subscriptionsQuery?.data?.length;
  const resourceGroupsCount = Object.values(
    resourceGroupsQuery?.resourceGroups
  ).flatMap((x) => Object.values(x)).length;

  return (
    <>
      <PageHeader title="Home" breadcrumbs={[{ label: 'Dashboard' }]} />

      <div className="mx-4">
        {subscriptionsQuery.data && (
          <DashboardGrid>
            <DashboardItem
              value={subscriptionsCount as number}
              icon="fa fa-th-list"
              type="Subscription"
            />
            {!resourceGroupsQuery.isError && !resourceGroupsQuery.isLoading && (
              <DashboardItem
                value={resourceGroupsCount}
                icon="fa fa-th-list"
                type="Resource group"
              />
            )}
          </DashboardGrid>
        )}
      </div>
    </>
  );
}

export const DashboardViewAngular = r2a(DashboardView, []);
