import { BarChart2Icon } from 'lucide-react';

import { StatsLineChart } from '@/react/components/Charts/StatsLineChart';

import { Widget, WidgetBody, WidgetTitle } from '@@/Widget';

import { ChartPoint, formatBytes } from '../chartPoint';

import { PRIMARY, SECONDARY } from './colors';

type Props = {
  chartData: ChartPoint[];
};

export function NetworkUsageChart({ chartData }: Props) {
  return (
    <Widget>
      <WidgetTitle icon={BarChart2Icon} title="Network usage (aggregate)" />
      <WidgetBody>
        <StatsLineChart
          data={chartData}
          series={[
            { dataKey: 'rx', name: 'RX on eth0', color: PRIMARY },
            { dataKey: 'tx', name: 'TX on eth0', color: SECONDARY },
          ]}
          yAxisFormatter={formatBytes}
        />
      </WidgetBody>
    </Widget>
  );
}
