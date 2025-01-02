import { name } from './name';
import { role } from './role';
import { status } from './status';
import { conditions } from './conditions';
import { cpu } from './cpu';
import { memory } from './memory';
import { version } from './version';
import { ip } from './ip';
import { getActions } from './actions';

export function getColumns(isServerMetricsEnabled: boolean) {
  if (!isServerMetricsEnabled) {
    return [name, role, status, conditions, cpu, memory, version, ip];
  }

  return [
    name,
    role,
    status,
    conditions,
    cpu,
    memory,
    version,
    ip,
    getActions(isServerMetricsEnabled),
  ];
}
