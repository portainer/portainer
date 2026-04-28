import clsx from 'clsx';
import { PropsWithChildren } from 'react';
import { Cpu, Hexagon, LaptopMinimal, MemoryStick } from 'lucide-react';

import { Icon, IconProps } from '@/react/components/Icon';

interface Props extends IconProps {
  title?: string;
  icon: IconProps['icon'];
  iconClass?: string;
}

export function StatsItem({
  title,
  icon,
  children,
  iconClass,
}: PropsWithChildren<Props>) {
  return (
    <div
      className={clsx(
        'flex flex-col items-center',
        'h-full gap-1 rounded-lg p-2',
        'bg-gray-2 th-highcontrast:bg-transparent th-dark:bg-gray-iron-10',
        'border border-solid border-gray-4 th-dark:border-gray-8'
      )}
    >
      <div className="flex items-center gap-1 text-[10px]">
        <Icon className={clsx('icon icon-sm', iconClass)} icon={icon} />
        <span>{title}</span>
      </div>
      <div className="flex w-full items-baseline gap-1">{children}</div>
    </div>
  );
}

interface StatsProps {
  value: string | number | undefined;
}

export function NodeStats({ value }: StatsProps) {
  return (
    <StatsItem icon={LaptopMinimal} title="NODES">
      <span className="text-left font-bold leading-none">{value}</span>
    </StatsItem>
  );
}

export function CPUStats({ value }: StatsProps) {
  return (
    <StatsItem icon={Cpu} title="CPUS">
      <span className="text-left font-bold leading-none">{value}</span>
      <span className="align-baseline text-xs leading-none">cores</span>
    </StatsItem>
  );
}

export function MemoryStats({ value }: StatsProps) {
  return (
    <StatsItem icon={MemoryStick} title="MEMORY">
      <span className="text-left font-bold leading-none">{value}</span>
    </StatsItem>
  );
}

interface ContainerStatsProps {
  total: number;
  running: number;
  stopped: number;
}

export function ContainerStats({
  total,
  running,
  stopped,
}: ContainerStatsProps) {
  const actualTotal = total || running + stopped;
  return (
    <StatsItem title="CONTAINERS" icon={Hexagon}>
      <div className="flex w-full flex-col">
        <div>
          <span className="text-base font-bold leading-none">{running}</span>
          <span> / {actualTotal}</span>
        </div>
        {actualTotal > 0 && (
          <progress
            className="h-[4px] w-auto rounded bg-gray-4 th-dark:bg-white/10"
            value={running}
            max={actualTotal}
            aria-label={`${running} of ${actualTotal} containers running`}
          />
        )}
      </div>
    </StatsItem>
  );
}
