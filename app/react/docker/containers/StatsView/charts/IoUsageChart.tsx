import { BarChart2Icon } from 'lucide-react';

import { StatsLineChart } from '@/react/components/Charts/StatsLineChart';

import { Widget, WidgetBody, WidgetTitle } from '@@/Widget';

import { ChartPoint, formatBytes } from '../chartPoint';

import { PRIMARY, SECONDARY } from './colors';

type Props = {
  chartData: ChartPoint[];
};

export function IoUsageChart({ chartData }: Props) {
  return (
    <Widget>
      <WidgetTitle icon={BarChart2Icon} title="I/O usage (aggregate)" />
      <WidgetBody>
        <StatsLineChart
          data={chartData}
          series={[
            {
              dataKey: 'ioRead',
              name: 'Read (Aggregate)',
              color: PRIMARY,
              area: true,
              stackId: 'io',
            },
            {
              dataKey: 'ioWrite',
              name: 'Write (Aggregate)',
              color: SECONDARY,
              area: true,
              stackId: 'io',
            },
          ]}
          yAxisFormatter={formatBytes}
        />
      </WidgetBody>
    </Widget>
  );
}
