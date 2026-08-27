import { StatsLineChart } from '@/react/components/Charts/StatsLineChart';

import { Widget, WidgetBody, WidgetTitle } from '@@/Widget';
import { IconProps } from '@@/Icon';

import { ChartPoint, formatBytes } from '../chartPoint';

import { PRIMARY } from './colors';

type Props = {
  chartData: ChartPoint[];
  icon: IconProps['icon'];
  yAxisDomain?: [number | string, number | string];
};

export function MemoryUsageChart({ chartData, icon, yAxisDomain }: Props) {
  return (
    <Widget>
      <WidgetTitle icon={icon} title="Memory usage" />
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
          yAxisDomain={yAxisDomain}
        />
      </WidgetBody>
    </Widget>
  );
}
