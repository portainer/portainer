import { Cpu, Database, HardDrive, ArrowDown, ArrowUp } from 'lucide-react';
import clsx from 'clsx';

import { useSystemMetrics } from '@/react/portainer/system/useSystemMetrics';

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / 1024 ** i).toFixed(1)} ${units[i]}`;
}

export function ResourceCharts({ isOpen }: { isOpen: boolean }) {
  const { data } = useSystemMetrics();

  if (!isOpen || !data) return null;

  return (
    <div className="mt-6 flex w-full flex-col gap-4 px-2 text-white">
      <ResourceItem
        icon={<Cpu size={14} />}
        label="CPU"
        value={data.cpu}
        color="bg-blue-6"
        detail={`${data.cpuCores} cores`}
      />
      <ResourceItem
        icon={<Database size={14} />}
        label="RAM"
        value={data.ram}
        color="bg-orange-6"
        detail={`${formatBytes(data.ramUsed)} / ${formatBytes(data.ramTotal)}`}
      />
      <ResourceItem
        icon={<HardDrive size={14} />}
        label="Disk"
        value={data.disk}
        color="bg-success-7"
        detail={`${formatBytes(data.diskUsed)} / ${formatBytes(data.diskTotal)}`}
      />
      <DiskIOItem read={data.diskRead} write={data.diskWrite} />
    </div>
  );
}

function ResourceItem({
  icon,
  label,
  value,
  color,
  detail,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
  detail: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider opacity-70">
        <div className="flex items-center gap-1.5">
          <span className="text-white">{icon}</span>
          <span>{label}</span>
        </div>
        <span>{value.toFixed(1)}%</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-graphite-800/50 shadow-inner">
        <div
          className={clsx('h-full transition-all duration-1000 ease-in-out', color)}
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="text-[9px] opacity-50">{detail}</span>
    </div>
  );
}

function DiskIOItem({ read, write }: { read: number; write: number }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider opacity-70">
        <span className="text-white"><HardDrive size={14} /></span>
        <span>Disk I/O</span>
      </div>
      <div className="flex gap-3 text-[9px] opacity-60">
        <span className="flex items-center gap-0.5">
          <ArrowDown size={10} className="text-blue-4" />
          {formatBytes(read)}/s
        </span>
        <span className="flex items-center gap-0.5">
          <ArrowUp size={10} className="text-orange-4" />
          {formatBytes(write)}/s
        </span>
      </div>
    </div>
  );
}
