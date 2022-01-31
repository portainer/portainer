import { useEnvironmentId } from '@/portainer/hooks/useEnvironmentId';
import { PageHeader } from '@/portainer/components/PageHeader';
import { DashboardItem } from '@/portainer/components/Dashboard/DashboardItem';
import { r2a } from '@/react-tools/react2angular';

import { useResourceGroups, useSubscriptions } from '../queries';

export function DashboardView() {
  const environmentId = useEnvironmentId();

  const subscriptionsQuery = useSubscriptions(environmentId);

  const resourceGroupsQuery = useResourceGroups(
    environmentId,
    subscriptionsQuery.data
  );

  const subscriptionsCount = subscriptionsQuery?.data?.length;
  const resourceGroupsCount = Object.values(
    resourceGroupsQuery.resourceGroups
  ).flatMap((x) => Object.values(x)).length;

  return (
    <>
      <PageHeader title="Home" breadcrumbs={[{ label: 'Dashboard' }]} />

      {subscriptionsQuery.data && (
        <div className="row">
          <DashboardItem
            value={subscriptionsCount as number}
            icon="fa fa-th-list"
            type="Subscriptions"
          />

          {!resourceGroupsQuery.isError && !resourceGroupsQuery.isLoading && (
            <DashboardItem
              value={resourceGroupsCount}
              icon="fa fa-th-list"
              type="Resource groups"
            />
          )}
        </div>
      )}
    </>
  );
}

export const DashboardViewAngular = r2a(DashboardView, []);
