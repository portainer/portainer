import { BarChart2Icon } from 'lucide-react';

import { StatsLineChart } from '@/react/components/Charts/StatsLineChart';

import { Widget, WidgetBody, WidgetTitle } from '@@/Widget';

import { ChartPoint, formatPercent } from '../chartPoint';

import { PRIMARY } from './colors';

type Props = {
  chartData: ChartPoint[];
};

export function CpuUsageChart({ chartData }: Props) {
  return (
    <Widget>
      <WidgetTitle icon={BarChart2Icon} title="CPU usage" />
      <WidgetBody>
        <StatsLineChart
          data={chartData}
          series={[
            {
              dataKey: 'cpu',
              name: 'CPU',
              color: PRIMARY,
              area: true,
            },
          ]}
          yAxisFormatter={formatPercent}
        />
      </WidgetBody>
    </Widget>
  );
}
