import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';

import { DashboardItem } from '@@/DashboardItem';
import { Widget, WidgetTitle, WidgetBody } from '@@/Widget';
import { PageHeader } from '@@/PageHeader';
import { DashboardGrid } from '@@/DashboardItem/DashboardGrid';

import { useDashboard } from './useDashboard';
import { RunningStatus } from './RunningStatus';

export function DashboardView() {
  const environmentId = useEnvironmentId();
  const dashboardQuery = useDashboard(environmentId);

  const running = dashboardQuery.data?.RunningTaskCount || 0;
  const stopped = (dashboardQuery.data?.TaskCount || 0) - running;

  return (
    <>
      <PageHeader
        title="Dashboard"
        breadcrumbs={[{ label: 'Environment summary' }]}
      />

      {dashboardQuery.isLoading ? (
        <div className="text-center" style={{ marginTop: '30%' }}>
          Connecting to the Edge environment...
          <i className="fa fa-cog fa-spin space-left" />
        </div>
      ) : (
        <>
          <div className="row">
            <div className="col-sm-12">
              {/* cluster info */}
              <Widget>
                <WidgetTitle
                  icon="fa-tachometer-alt"
                  title="Cluster information"
                />
                <WidgetBody className="no-padding">
                  <table className="table">
                    <tbody>
                      <tr>
                        <td>Nodes in the cluster</td>
                        <td>{dashboardQuery.data?.NodeCount ?? '-'}</td>
                      </tr>
                    </tbody>
                  </table>
                </WidgetBody>
              </Widget>
            </div>
          </div>

          <div className="mx-4">
            <DashboardGrid>
              {/* jobs */}
              <DashboardItem
                value={dashboardQuery.data?.JobCount}
                icon="fa fa-th-list"
                type="Nomad Job"
              />
              {/* groups */}
              <DashboardItem
                value={dashboardQuery.data?.GroupCount}
                icon="fa fa-list-alt"
                type="Group"
              />
              {/* tasks */}
              <DashboardItem
                value={dashboardQuery.data?.TaskCount}
                icon="fa fa-cubes"
                type="Task"
              >
                {/* running status of tasks */}
                <RunningStatus running={running} stopped={stopped} />
              </DashboardItem>
            </DashboardGrid>
          </div>
        </>
      )}
    </>
  );
}
