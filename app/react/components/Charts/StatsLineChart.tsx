import {
  Area,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

export type SeriesConfig = {
  dataKey: string;
  name: string;
  color: string;
  area?: boolean;
  stackId?: string;
};

interface Props {
  data: Array<Record<string, string | number>>;
  timeKey?: string;
  series: SeriesConfig[];
  yAxisFormatter: (value: number) => string;
  height?: number;
  yAxisDomain?: [number | string, number | string];
}

export function StatsLineChart({
  data,
  timeKey = 'time',
  series,
  yAxisFormatter,
  height = 300,
  yAxisDomain = [0, 'auto'],
}: Props) {
  return (
    <div style={{ height }}>
      <ResponsiveContainer
        width="100%"
        height="100%"
        minHeight={height}
        initialDimension={{ width: 1, height }}
      >
        <ComposedChart
          data={data}
          margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey={timeKey} tick={{ fontSize: 11 }} />
          <YAxis
            domain={yAxisDomain}
            tickFormatter={yAxisFormatter}
            tick={{ fontSize: 11 }}
            width={75}
          />
          <Tooltip
            formatter={(value: unknown) =>
              yAxisFormatter(typeof value === 'number' ? value : 0)
            }
            isAnimationActive={false}
          />
          <Legend />
          {series.map((s) =>
            s.area ? (
              <Area
                key={s.dataKey}
                type="monotone"
                dataKey={s.dataKey}
                name={s.name}
                stroke={s.color}
                fill={s.color}
                fillOpacity={0.3}
                stackId={s.stackId}
                dot={false}
                isAnimationActive={false}
                activeDot={{ r: 3 }}
                strokeWidth={2}
              />
            ) : (
              <Line
                key={s.dataKey}
                type="monotone"
                dataKey={s.dataKey}
                name={s.name}
                stroke={s.color}
                dot={false}
                isAnimationActive={false}
                activeDot={{ r: 3 }}
                strokeWidth={2}
              />
            )
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
