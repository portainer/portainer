import { Package } from 'react-feather';

import { useEnvironmentId } from '@/portainer/hooks/useEnvironmentId';

import { PageHeader } from '@@/PageHeader';
import { DashboardItem } from '@@/DashboardItem';
import { DashboardGrid } from '@@/DashboardItem/DashboardGrid';

import { useResourceGroups } from '../queries/useResourceGroups';
import { useSubscriptions } from '../queries/useSubscriptions';

import SubscriptionsIcon from './icon-subscription.svg?c';

export function DashboardView() {
  const environmentId = useEnvironmentId();

  const subscriptionsQuery = useSubscriptions(environmentId);

  const resourceGroupsQuery = useResourceGroups(
    environmentId,
    subscriptionsQuery.data
  );

  const subscriptionsCount = subscriptionsQuery.data?.length;
  const resourceGroupsCount = Object.values(
    resourceGroupsQuery.resourceGroups
  ).flatMap((x) => Object.values(x)).length;

  return (
    <>
      <PageHeader title="Home" breadcrumbs={[{ label: 'Dashboard' }]} />

      <div className="mx-4">
        {subscriptionsQuery.data && (
          <DashboardGrid>
            <DashboardItem
              value={subscriptionsCount as number}
              icon={SubscriptionsIcon}
              type="Subscription"
            />
            {!resourceGroupsQuery.isError && !resourceGroupsQuery.isLoading && (
              <DashboardItem
                value={resourceGroupsCount}
                icon={Package}
                type="Resource group"
              />
            )}
          </DashboardGrid>
        )}
      </div>
    </>
  );
}
