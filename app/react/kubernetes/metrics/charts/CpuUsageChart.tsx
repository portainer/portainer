import { CpuIcon } from 'lucide-react';

import { StatsLineChart } from '@/react/components/Charts/StatsLineChart';

import { Widget, WidgetBody, WidgetTitle } from '@@/Widget';

import { ChartPoint, formatPercent } from '../chartPoint';

import { SECONDARY } from './colors';

type Props = {
  chartData: ChartPoint[];
};

export function CpuUsageChart({ chartData }: Props) {
  return (
    <Widget>
      <WidgetTitle icon={CpuIcon} title="CPU usage" />
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
  );
}
