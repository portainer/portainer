import { PropsWithChildren } from 'react';
import { Box, Cpu, Gpu, LaptopMinimal, MemoryStick } from 'lucide-react';

import { Icon, IconProps } from '@/react/components/Icon';

interface Props {
  title?: string;
  icon: IconProps['icon'];
}

export function StatsItem({ title, icon, children }: PropsWithChildren<Props>) {
  return (
    <div className="flex min-w-0 flex-1 basis-0 items-center justify-center gap-2 p-2 md:w-[120px] md:flex-none md:basis-auto">
      <Icon
        className="icon icon-lg shrink-0 text-gray-7 th-highcontrast:text-white th-dark:text-gray-5"
        icon={icon}
      />
      <div className="flex min-w-0 flex-col gap-0.5">
        <div className="flex flex-wrap items-baseline gap-1 text-base font-medium leading-none text-gray-9 th-highcontrast:text-white th-dark:text-white">
          {children}
        </div>
        <span className="truncate text-2xs font-medium uppercase leading-none tracking-wide text-gray-7 th-highcontrast:text-white th-dark:text-gray-5">
          {title}
        </span>
      </div>
    </div>
  );
}

interface StatsProps {
  value: string | number | undefined;
}

export function NodeStats({ value }: StatsProps) {
  return (
    <StatsItem icon={LaptopMinimal} title="NODES">
      <span className="text-left">{value}</span>
    </StatsItem>
  );
}

export function CPUStats({ value }: StatsProps) {
  return (
    <StatsItem icon={Cpu} title="CORES">
      <span className="tabular-nums">{value}</span>
    </StatsItem>
  );
}

export function MemoryStats({ value }: StatsProps) {
  return (
    <StatsItem icon={MemoryStick} title="MEMORY">
      <span className="text-left">{value}</span>
    </StatsItem>
  );
}

export function GpuStats({ value }: StatsProps) {
  return (
    <StatsItem icon={Gpu} title="GPUS">
      <span className="text-left">{value}</span>
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
  const safeRunning = running || 0;
  const safeStopped = stopped || 0;
  const actualTotal = total || safeRunning + safeStopped;
  return (
    <StatsItem title="CONTAINERS" icon={Box}>
      <span aria-hidden="true">
        {safeRunning} / {actualTotal}
      </span>
      <span className="sr-only">
        {safeRunning} of {actualTotal} containers running
      </span>
    </StatsItem>
  );
}
