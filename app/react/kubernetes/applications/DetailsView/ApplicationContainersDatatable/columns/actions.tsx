import { BarChart, FileText, Terminal } from 'lucide-react';

import { Authorized } from '@/react/hooks/useUser';

import { Link } from '@@/Link';
import { Icon } from '@@/Icon';

import { columnHelper } from './helper';

export function getActions(isServerMetricsEnabled: boolean) {
  return columnHelper.accessor(() => '', {
    header: 'Actions',
    enableSorting: false,
    cell: ({ row: { original: container } }) => (
      <div className="flex gap-x-2">
        {container.status === 'Running' && isServerMetricsEnabled && (
          <Link
            className="flex items-center gap-1"
            to="kubernetes.applications.application.stats"
            params={{ pod: container.podName, container: container.name }}
            data-cy={`application-container-stats-${container.name}`}
          >
            <Icon icon={BarChart} />
            Stats
          </Link>
        )}
        <Link
          className="flex items-center gap-1"
          to="kubernetes.applications.application.logs"
          params={{ pod: container.podName, container: container.name }}
          data-cy={`application-container-logs-${container.name}`}
        >
          <Icon icon={FileText} />
          Logs
        </Link>
        {container.status === 'Running' && (
          <Authorized authorizations="K8sApplicationConsoleRW">
            <Link
              className="flex items-center gap-1"
              to="kubernetes.applications.application.console"
              params={{ pod: container.podName, container: container.name }}
              data-cy={`application-container-console-${container.name}`}
            >
              <Icon icon={Terminal} />
              Console
            </Link>
          </Authorized>
        )}
      </div>
    ),
  });
}
