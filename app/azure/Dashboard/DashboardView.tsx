import { useEnvironmentId } from '@/portainer/hooks/useEnvironmentId';
import { PageHeader } from '@/portainer/components/PageHeader';
import { Widget, WidgetBody } from '@/portainer/components/widget';
import { r2a } from '@/react-tools/react2angular';

import { useResourceGroups, useSubscriptions } from '../queries';

export function DashboardView() {
  const environmentId = useEnvironmentId();
  const { data: subscriptions, isLoading: isLoadingSubscriptions } =
    useSubscriptions(environmentId);
  const { resourceGroups, isLoading: isLoadingResourceGroups } =
    useResourceGroups(environmentId, subscriptions);
  const isLoading = isLoadingSubscriptions || isLoadingResourceGroups;

  // Inspired by azureService.aggregate
  let aggregatedResources: unknown[] = [];
  Object.keys(resourceGroups).forEach((key) => {
    aggregatedResources = aggregatedResources.concat(resourceGroups[key]);
  });

  if (isLoading) {
    return null;
  }

  return (
    <>
      <PageHeader title="Home" breadcrumbs={[{ label: 'Dashboard' }]} />

      {subscriptions && (
        <div className="row">
          <div className="col-sm-12 col-md-6">
            <Widget>
              <WidgetBody>
                <div className="widget-icon blue pull-left">
                  <i className="fa fa-th-list" />
                </div>
                <div className="title">{subscriptions.length}</div>
                <div className="comment">Subscriptions</div>
              </WidgetBody>
            </Widget>
          </div>
          <div className="col-sm-12 col-md-6">
            <Widget>
              <WidgetBody>
                <div className="widget-icon blue pull-left">
                  <i className="fa fa-th-list" />
                </div>
                <div className="title">{aggregatedResources.length}</div>
                <div className="comment">Resource groups</div>
              </WidgetBody>
            </Widget>
          </div>
        </div>
      )}
    </>
  );
}

export const DashboardViewAngular = r2a(DashboardView, []);
