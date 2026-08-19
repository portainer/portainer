import { useCurrentStateAndParams } from '@uirouter/react';
import filesizeParser from 'filesize-parser';
import { filesize } from 'filesize';
import moment from 'moment';
import { useEffect, useRef, useState } from 'react';

import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';
import { getMetricsForNode } from '@/react/kubernetes/metrics/queries/useNodeMetricsQuery';
import { useNodeQuery } from '@/react/kubernetes/cluster/queries/useNodeQuery';
import { parseCPU } from '@/react/kubernetes/utils';
import { StatsLineChart } from '@/react/components/Charts/StatsLineChart';

import { InformationPanel } from '@@/InformationPanel';
import { PageHeader } from '@@/PageHeader';
import { Widget, WidgetBody, WidgetTitle } from '@@/Widget';

const CHART_LIMIT = 600;
const REFRESH_RATES = [30, 60] as const;

const PRIMARY = '#97bbcd';
const SECONDARY = '#ffb4ae';

type ChartPoint = {
  time: string;
  cpu: number;
  memory: number;
};

type MetricsState = 'checking' | 'available' | 'unavailable';

function formatBytes(value: number): string {
  return value > 5
    ? filesize(value, { base: 10, round: 1 })
    : `${value.toFixed(1)}B`;
}

function formatPercent(value: number): string {
  return value > 1 ? `${Math.round(value)}%` : `${value.toFixed(1)}%`;
}

export function NodeStatsView() {
  const environmentId = useEnvironmentId();
  const {
    params: { nodeName },
  } = useCurrentStateAndParams();

  const [refreshRate, setRefreshRate] = useState(30);
  const [chartData, setChartData] = useState<ChartPoint[]>([]);
  const [metricsState, setMetricsState] = useState<MetricsState>('checking');

  const nodeQuery = useNodeQuery(environmentId, nodeName, {
    select: (node) => parseCPU(node.status?.allocatable?.cpu ?? '') || 1,
  });
  const nodeCPU = nodeQuery.data ?? 1;

  const metricsCheckedRef = useRef(false);

  useEffect(() => {
    metricsCheckedRef.current = false;
    setMetricsState('checking');

    let active = true;
    let intervalId: ReturnType<typeof setInterval> | null = null;

    async function doFetch() {
      try {
        const metrics = await getMetricsForNode(environmentId, nodeName);
        if (!active) return;

        if (!metricsCheckedRef.current) {
          metricsCheckedRef.current = true;
          setMetricsState('available');
        }

        if (metrics) {
          const memory = filesizeParser(metrics.usage.memory);
          const cpu = parseCPU(metrics.usage.cpu);
          const time = moment(metrics.metadata.creationTimestamp).format(
            'HH:mm:ss'
          );

          setChartData((prev) => {
            const point: ChartPoint = {
              time,
              cpu: (cpu / nodeCPU) * 100,
              memory,
            };
            const next = [...prev, point];
            return next.length > CHART_LIMIT ? next.slice(1) : next;
          });
        }
      } catch {
        if (!active) return;
        if (!metricsCheckedRef.current) {
          metricsCheckedRef.current = true;
          setMetricsState('unavailable');
        }
        if (intervalId) {
          clearInterval(intervalId);
          intervalId = null;
        }
      }
    }

    doFetch();
    intervalId = setInterval(doFetch, refreshRate * 1000);

    return () => {
      active = false;
      if (intervalId) clearInterval(intervalId);
    };
  }, [environmentId, nodeName, nodeCPU, refreshRate]);

  return (
    <>
      <PageHeader
        title="Node stats"
        breadcrumbs={[
          { label: 'Cluster', link: 'kubernetes.cluster' },
          {
            label: nodeName,
            link: 'kubernetes.cluster.node',
            linkParams: { nodeName },
          },
          nodeName,
        ]}
      />

      {metricsState === 'unavailable' && (
        <InformationPanel title="Unable to retrieve node metrics">
          <span className="small text-muted">
            Portainer was unable to retrieve any metrics associated to that
            node. Please contact your administrator to ensure that the
            Kubernetes metrics feature is properly configured.
          </span>
        </InformationPanel>
      )}

      {metricsState === 'available' && (
        <>
          <div className="row">
            <div className="col-md-12">
              <Widget>
                <WidgetTitle icon="info" title="About statistics" />
                <WidgetBody>
                  <form className="form-horizontal">
                    <div className="form-group">
                      <div className="col-sm-12">
                        <span className="small text-muted">
                          This view displays real-time statistics about the node{' '}
                          <b>{nodeName}</b>.
                        </span>
                      </div>
                    </div>
                    <div className="form-group">
                      <label
                        htmlFor="refreshRate"
                        className="col-sm-3 col-md-2 control-label text-left"
                      >
                        Refresh rate
                      </label>
                      <div className="col-sm-3 col-md-2">
                        <select
                          id="refreshRate"
                          className="form-control"
                          value={refreshRate}
                          onChange={(e) =>
                            setRefreshRate(Number(e.target.value))
                          }
                          data-cy="node-stats-refresh-rate"
                        >
                          {REFRESH_RATES.map((r) => (
                            <option key={r} value={r}>
                              {r}s
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </form>
                </WidgetBody>
              </Widget>
            </div>
          </div>

          <div className="row">
            <div className="col-lg-6 col-md-12">
              <Widget>
                <WidgetTitle icon="cpu" title="Memory usage" />
                <WidgetBody>
                  <StatsLineChart
                    data={chartData}
                    series={[
                      {
                        dataKey: 'memory',
                        name: 'Memory',
                        color: PRIMARY,
                        area: true,
                      },
                    ]}
                    yAxisFormatter={formatBytes}
                  />
                </WidgetBody>
              </Widget>
            </div>

            <div className="col-lg-6 col-md-12">
              <Widget>
                <WidgetTitle icon="cpu" title="CPU usage" />
                <WidgetBody>
                  <StatsLineChart
                    data={chartData}
                    series={[
                      {
                        dataKey: 'cpu',
                        name: 'CPU',
                        color: SECONDARY,
                        area: true,
                      },
                    ]}
                    yAxisFormatter={formatPercent}
                  />
                </WidgetBody>
              </Widget>
            </div>
          </div>
        </>
      )}
    </>
  );
}
