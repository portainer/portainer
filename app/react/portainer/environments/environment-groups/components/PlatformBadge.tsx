import { EnvironmentGroup } from '../types';
import { getPlatformLabel } from '../utils/getPlatformLabel';

const colorByLabel: Record<string, string> = {
  Docker: 'bg-green-2 th-dark:bg-green-9',
  Kubernetes: 'bg-blue-2 th-dark:bg-blue-9',
  Podman: 'bg-orange-2 th-dark:bg-orange-9',
  Mixed: 'bg-purple-2 th-dark:bg-purple-9',
  Empty: 'bg-gray-2 th-dark:bg-gray-8',
};

interface Props {
  group: EnvironmentGroup;
}

export function PlatformBadge({ group }: Props) {
  const platformLabel = getPlatformLabel(group);
  const colorClass =
    colorByLabel[platformLabel] ?? 'bg-gray-2 th-dark:bg-gray-8';

  return (
    <span
      className={`flex w-fit items-center rounded-xl ${colorClass} px-2 py-px text-xs font-bold text-gray-9 th-highcontrast:bg-gray-8 th-highcontrast:text-white th-dark:text-gray-3`}
      data-cy={`environment-group-platform_${group.Name}`}
    >
      {platformLabel}
    </span>
  );
}
