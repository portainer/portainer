import { name } from './name';
import { role } from './role';
import { nodeGroup } from './nodeGroup';
import { instanceType } from './instanceType';
import { status } from './status';
import { conditions } from './conditions';
import { cpu } from './cpu';
import { memory } from './memory';
import { version } from './version';
import { ip } from './ip';
import { labels } from './labels';
import { taints } from './taints';
import { cachedImages } from './cachedImages';
import { getActions } from './actions';

export function getColumns({
  isServerMetricsEnabled,
  hasNodeGroups,
  hasInstanceTypes,
}: {
  isServerMetricsEnabled: boolean;
  hasNodeGroups: boolean;
  hasInstanceTypes: boolean;
}) {
  // Node group and instance type only exist on some distributions, so their
  // columns are left out entirely rather than shown empty for every node.
  const baseColumns = [
    name,
    role,
    ...(hasNodeGroups ? [nodeGroup] : []),
    ...(hasInstanceTypes ? [instanceType] : []),
    status,
    conditions,
    cpu,
    memory,
    version,
    ip,
    labels,
    taints,
    cachedImages,
  ];

  if (!isServerMetricsEnabled) {
    return baseColumns;
  }

  return [...baseColumns, getActions(isServerMetricsEnabled)];
}
