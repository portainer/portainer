import { filesize } from 'filesize';
import filesizeParser from 'filesize-parser';
import moment from 'moment';

import { parseCPU } from '@/react/kubernetes/utils';

export type ChartPoint = {
  time: string;
  cpu: number;
  memory: number;
};

export function formatBytes(value: number): string {
  return value > 5
    ? filesize(value, { base: 10, round: 1 })
    : `${value.toFixed(1)}B`;
}

export function formatPercent(value: number): string {
  return value > 1 ? `${Math.round(value)}%` : `${value.toFixed(1)}%`;
}

export function toChartPoint(
  cpu: string,
  memory: string,
  timestamp: string,
  nodeCPU: number
): ChartPoint {
  return {
    time: moment(timestamp).format('HH:mm:ss'),
    cpu: (parseCPU(cpu) / nodeCPU) * 100,
    memory: filesizeParser(memory),
  };
}
