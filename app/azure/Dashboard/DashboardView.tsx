import { useEnvironmentId } from '@/portainer/hooks/useEnvironmentId';
import { PageHeader } from '@/portainer/components/PageHeader';
import { r2a } from '@/react-tools/react2angular';

import { aggregateResourceGroups } from '../utils';
import { useResourceGroups, useSubscriptions } from '../queries';

import { DashboardItem } from './DashboardItem';

export function DashboardView() {
  const environmentId = useEnvironmentId();
  const { data: subscriptions, isLoading: isLoadingSubscriptions } =
    useSubscriptions(environmentId);
  const { resourceGroups, isLoading: isLoadingResourceGroups } =
    useResourceGroups(environmentId, subscriptions);
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
          <DashboardItem
            value={aggregateResourceGroups(resourceGroups).length}
            icon="fa fa-th-list"
            comment="Resource groups"
          />
        </div>
      )}
    </>
  );
}

export const DashboardViewAngular = r2a(DashboardView, []);
