import { useCurrentStateAndParams } from '@uirouter/react';
import filesizeParser from 'filesize-parser';
import { filesize } from 'filesize';
import moment from 'moment';
import { useEffect, useRef, useState } from 'react';

import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';
import { getMetricsForPod } from '@/react/kubernetes/metrics/metrics';
import { useNodeQuery } from '@/react/kubernetes/cluster/queries/useNodeQuery';
import { parseCPU } from '@/react/kubernetes/utils';
import { StatsLineChart } from '@/react/components/Charts/StatsLineChart';

import { InformationPanel } from '@@/InformationPanel';
import { PageHeader } from '@@/PageHeader';
import { Widget, WidgetBody, WidgetTitle } from '@@/Widget';

import { getPod } from './getPod';

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

export function ApplicationStatsView() {
  const environmentId = useEnvironmentId();
  const {
    params: {
      namespace,
      name: applicationName,
      pod: podName,
      container: containerName,
    },
  } = useCurrentStateAndParams();

  const [refreshRate, setRefreshRate] = useState(30);
  const [chartData, setChartData] = useState<ChartPoint[]>([]);
  const [metricsState, setMetricsState] = useState<MetricsState>('checking');

  // Get pod to find which node it runs on (needed for CPU% calculation)
  const [podNodeName, setPodNodeName] = useState<string | undefined>(undefined);
  useEffect(() => {
    async function fetchPod() {
      try {
        const pod = await getPod(environmentId, namespace, podName);
        setPodNodeName(pod.spec?.nodeName ?? undefined);
      } catch {
        // pod fetch failure is non-critical; node CPU falls back to 1
      }
    }
    void fetchPod();
  }, [environmentId, namespace, podName]);

  const nodeQuery = useNodeQuery(environmentId, podNodeName ?? '', {
    enabled: !!podNodeName,
    select: (node) => parseCPU(node.status?.allocatable?.cpu ?? '') || 1,
  });
  const nodeCPU = nodeQuery.data ?? 1;

  useEffect(() => {
    if (nodeQuery.data !== undefined) {
      setChartData([]);
    }
  }, [nodeQuery.data]);

  const metricsCheckedRef = useRef(false);

  useEffect(() => {
    metricsCheckedRef.current = false;

    let active = true;
    let intervalId: ReturnType<typeof setInterval> | null = null;

    async function doFetch() {
      if (!metricsCheckedRef.current) {
        setMetricsState('checking');
      }
      try {
        const metrics = await getMetricsForPod(
          environmentId,
          namespace,
          podName
        );
        if (!active) return;

        if (!metricsCheckedRef.current) {
          metricsCheckedRef.current = true;
          setMetricsState('available');
        }

        const metricsData = metrics as {
          timestamp?: string;
          containers?: Array<{
            name: string;
            usage: { cpu: string; memory: string };
          }>;
        };
        const container = metricsData.containers?.find(
          (c) => c.name === containerName
        );

        if (container && metricsData.timestamp) {
          const memory = filesizeParser(container.usage.memory);
          const cpu = parseCPU(container.usage.cpu);
          const time = moment(metricsData.timestamp).format('HH:mm:ss');

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
  }, [environmentId, namespace, podName, containerName, nodeCPU, refreshRate]);

  return (
    <>
      <PageHeader
        title="Application stats"
        breadcrumbs={[
          { label: 'Namespaces', link: 'kubernetes.resourcePools' },
          {
            label: namespace,
            link: 'kubernetes.resourcePools.resourcePool',
            linkParams: { id: namespace },
          },
          { label: 'Applications', link: 'kubernetes.applications' },
          {
            label: applicationName,
            link: 'kubernetes.applications.application',
            linkParams: { name: applicationName, namespace },
          },
          'Pods',
          podName,
          'Containers',
          containerName,
          'Stats',
        ]}
      />

      {metricsState === 'unavailable' && (
        <InformationPanel title="Unable to retrieve container metrics">
          <span className="small text-warning">
            Portainer was unable to retrieve any metrics associated to that
            container. Please contact your administrator to ensure that the
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
                        <span className="small text-warning">
                          This view displays real-time statistics about the
                          container <b>{containerName}</b>.
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
                          data-cy="app-stats-refresh-rate"
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
                <WidgetTitle icon="svg-memory" title="Memory usage" />
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
