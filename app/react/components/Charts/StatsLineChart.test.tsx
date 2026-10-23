import { render, screen } from '@testing-library/react';

import { StatsLineChart } from './StatsLineChart';
import type { SeriesConfig } from './StatsLineChart';

vi.mock('recharts');

function yAxisFormatter(value: number): string {
  return `${value}%`;
}

const singleSeries: SeriesConfig[] = [
  { dataKey: 'cpu', name: 'CPU Usage', color: '#4e9af1' },
];

const multiSeries: SeriesConfig[] = [
  { dataKey: 'cpu', name: 'CPU Usage', color: '#4e9af1' },
  { dataKey: 'mem', name: 'Memory Usage', color: '#f1a24e' },
];

const stackedAreaSeries: SeriesConfig[] = [
  {
    dataKey: 'rx',
    name: 'Rx',
    color: '#4e9af1',
    area: true,
    stackId: 'network',
  },
  {
    dataKey: 'tx',
    name: 'Tx',
    color: '#f14e4e',
    area: true,
    stackId: 'network',
  },
];

const sampleData = [
  { time: '10:00', cpu: 20, mem: 40 },
  { time: '10:05', cpu: 35, mem: 55 },
];

describe('StatsLineChart', () => {
  it('renders without crashing on empty data and shows the legend entry', () => {
    render(
      <StatsLineChart
        data={[]}
        series={singleSeries}
        yAxisFormatter={yAxisFormatter}
      />
    );

    expect(screen.getByText('CPU Usage')).toBeVisible();
  });

  it('renders a legend entry for each series name', () => {
    render(
      <StatsLineChart
        data={sampleData}
        series={multiSeries}
        yAxisFormatter={yAxisFormatter}
      />
    );

    expect(screen.getByText('CPU Usage')).toBeVisible();
    expect(screen.getByText('Memory Usage')).toBeVisible();
  });

  it('renders an SVG element', () => {
    const { container } = render(
      <StatsLineChart
        data={sampleData}
        series={singleSeries}
        yAxisFormatter={yAxisFormatter}
      />
    );

    expect(container.querySelector('svg')).not.toBeNull();
  });

  it('applies the default height of 300px to the wrapper div', () => {
    const { container } = render(
      <StatsLineChart
        data={sampleData}
        series={singleSeries}
        yAxisFormatter={yAxisFormatter}
      />
    );

    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.style.height).toBe('300px');
  });

  it('applies a custom height to the wrapper div', () => {
    const { container } = render(
      <StatsLineChart
        data={sampleData}
        series={singleSeries}
        yAxisFormatter={yAxisFormatter}
        height={500}
      />
    );

    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.style.height).toBe('500px');
  });

  it('renders both legend entries for stacked area series', () => {
    render(
      <StatsLineChart
        data={sampleData}
        series={stackedAreaSeries}
        yAxisFormatter={yAxisFormatter}
      />
    );

    expect(screen.getByText('Rx')).toBeVisible();
    expect(screen.getByText('Tx')).toBeVisible();
  });

  it('renders correctly with a custom timeKey prop', () => {
    const dataWithCustomKey = [
      { ts: '10:00', cpu: 20 },
      { ts: '10:05', cpu: 30 },
    ];

    render(
      <StatsLineChart
        data={dataWithCustomKey}
        timeKey="ts"
        series={[{ dataKey: 'cpu', name: 'CPU Usage', color: '#4e9af1' }]}
        yAxisFormatter={yAxisFormatter}
      />
    );

    expect(screen.getByText('CPU Usage')).toBeVisible();
  });
});
