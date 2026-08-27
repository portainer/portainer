import { BarChart2Icon } from 'lucide-react';

import { StatsLineChart } from '@/react/components/Charts/StatsLineChart';

import { Widget, WidgetBody, WidgetTitle } from '@@/Widget';

import { ChartPoint, formatBytes } from '../chartPoint';

import { PRIMARY, SECONDARY } from './colors';

type Props = {
  chartData: ChartPoint[];
};

export function MemoryUsageChart({ chartData }: Props) {
  return (
    <Widget>
      <WidgetTitle icon={BarChart2Icon} title="Memory usage" />
      <WidgetBody>
        <StatsLineChart
          data={chartData}
          series={[
            {
              dataKey: 'memory',
              name: 'Memory',
              color: PRIMARY,
              area: true,
              stackId: 'mem',
            },
            {
              dataKey: 'cache',
              name: 'Cache',
              color: SECONDARY,
              area: true,
              stackId: 'mem',
            },
          ]}
          yAxisFormatter={formatBytes}
          yAxisDomain={['auto', 'auto']}
        />
      </WidgetBody>
    </Widget>
  );
}
