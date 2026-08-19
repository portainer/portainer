import { type LucideIcon } from 'lucide-react';

import { Icon } from '@@/Icon';

interface Props {
  icon: LucideIcon;
  label: string;
  value: string | number;
}

export function StatBlock({ icon, label, value }: Props) {
  return (
    <div className="flex min-w-[100px] flex-col gap-1 rounded-lg border border-solid border-gray-5 bg-gray-2 px-4 py-3 th-highcontrast:border-white th-highcontrast:bg-gray-10 th-dark:border-gray-8 th-dark:bg-gray-iron-10">
      <div className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-gray-7 th-highcontrast:text-gray-3 th-dark:text-gray-3">
        <Icon icon={icon} size="sm" />
        <span>{label}</span>
      </div>
      <span className="text-base font-semibold text-gray-9 th-highcontrast:text-white th-dark:text-white">
        {value}
      </span>
    </div>
  );
}
