import { Meta, StoryObj } from '@storybook/react-webpack5';
import { filesize } from 'filesize';

import { StatsLineChart } from './StatsLineChart';

// Same sample data as Charts.stories.tsx, combined into the object format StatsLineChart expects

const LABELS = Array.from(
  { length: 30 },
  (_, i) => `10:00:${String(i).padStart(2, '0')}`
);

const CPU_VALUES = [
  45, 52, 48, 61, 55, 42, 38, 65, 72, 68, 55, 49, 53, 61, 58, 44, 39, 47, 63,
  70, 65, 52, 48, 55, 60, 57, 45, 41, 50, 58,
];

const MEMORY_VALUES = Array.from(
  { length: 30 },
  (_, i) => (512 + i * 2) * 1024 * 1024
);
const CACHE_VALUES = Array.from(
  { length: 30 },
  (_, i) => (256 + i * 0.5) * 1024 * 1024
);

const RX_VALUES = [
  50_000, 120_000, 80_000, 250_000, 180_000, 90_000, 60_000, 350_000, 220_000,
  150_000, 80_000, 100_000, 200_000, 280_000, 160_000, 90_000, 70_000, 130_000,
  300_000, 240_000, 170_000, 100_000, 80_000, 150_000, 210_000, 190_000,
  120_000, 85_000, 140_000, 200_000,
];
const TX_VALUES = [
  10_000, 25_000, 18_000, 40_000, 30_000, 20_000, 12_000, 55_000, 35_000,
  28_000, 15_000, 20_000, 38_000, 45_000, 32_000, 18_000, 14_000, 25_000,
  50_000, 42_000, 35_000, 22_000, 16_000, 30_000, 40_000, 38_000, 25_000,
  17_000, 28_000, 40_000,
];

const READ_VALUES = [
  1_000_000, 2_500_000, 1_800_000, 3_500_000, 2_200_000, 1_500_000, 800_000,
  4_000_000, 2_800_000, 2_000_000, 1_200_000, 1_500_000, 2_700_000, 3_200_000,
  2_100_000, 1_300_000, 1_000_000, 1_800_000, 3_500_000, 2_900_000, 2_200_000,
  1_600_000, 1_200_000, 2_000_000, 2_800_000, 2_500_000, 1_800_000, 1_200_000,
  2_000_000, 2_800_000,
];
const WRITE_VALUES = [
  500_000, 1_000_000, 800_000, 1_500_000, 900_000, 700_000, 400_000, 1_800_000,
  1_200_000, 900_000, 600_000, 700_000, 1_200_000, 1_500_000, 1_000_000,
  600_000, 500_000, 800_000, 1_500_000, 1_300_000, 1_000_000, 700_000, 600_000,
  900_000, 1_200_000, 1_100_000, 800_000, 600_000, 900_000, 1_200_000,
];

const DATA = LABELS.map((time, i) => ({
  time,
  cpu: CPU_VALUES[i],
  memory: MEMORY_VALUES[i],
  cache: CACHE_VALUES[i],
  rx: RX_VALUES[i],
  tx: TX_VALUES[i],
  ioRead: READ_VALUES[i],
  ioWrite: WRITE_VALUES[i],
}));

function formatBytes(value: number): string {
  return value > 5
    ? (filesize(value, { base: 10, round: 1 }) as string)
    : `${value.toFixed(1)}B`;
}

function formatPercent(value: number): string {
  return value > 1 ? `${Math.round(value)}%` : `${value.toFixed(1)}%`;
}

const PRIMARY = '#97bbcd';
const SECONDARY = '#ffb4ae';

const meta: Meta<typeof StatsLineChart> = {
  title: 'Charts/Recharts',
  component: StatsLineChart,
};
export default meta;

type Story = StoryObj<typeof StatsLineChart>;

export const CPU: Story = {
  args: {
    data: DATA,
    series: [{ dataKey: 'cpu', name: 'CPU', color: PRIMARY, area: true }],
    yAxisFormatter: formatPercent,
  },
};

export const Memory: Story = {
  args: {
    data: DATA,
    series: [
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
    ],
    yAxisFormatter: formatBytes,
  },
};

export const MemoryWithoutCache: Story = {
  name: 'Memory (no cache)',
  args: {
    data: DATA,
    series: [{ dataKey: 'memory', name: 'Memory', color: PRIMARY, area: true }],
    yAxisFormatter: formatBytes,
  },
};

export const NetworkIO: Story = {
  name: 'Network I/O',
  args: {
    data: DATA,
    series: [
      { dataKey: 'rx', name: 'RX on eth0', color: PRIMARY },
      { dataKey: 'tx', name: 'TX on eth0', color: SECONDARY },
    ],
    yAxisFormatter: formatBytes,
  },
};

export const DiskIO: Story = {
  name: 'Disk I/O',
  args: {
    data: DATA,
    series: [
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
    ],
    yAxisFormatter: formatBytes,
  },
};
