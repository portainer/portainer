import { FileText, Info } from 'lucide-react';

import { Authorized } from '@/react/hooks/useUser';

import { Icon } from '@@/Icon';
import { Link } from '@@/Link';

interface State {
  showQuickActionInspect: boolean;
  showQuickActionLogs: boolean;
}

export function TaskTableQuickActions({
  taskId,
  state = {
    showQuickActionInspect: true,
    showQuickActionLogs: true,
  },
}: {
  taskId: string;
  state?: State;
}) {
  return (
    <div className="inline-flex space-x-1">
      {state.showQuickActionLogs && (
        <Authorized authorizations="DockerTaskLogs">
          <Link
            to="docker.tasks.task.logs"
            params={{ id: taskId }}
            title="Logs"
            data-cy="docker-task-logs-link"
          >
            <Icon icon={FileText} className="space-right" />
          </Link>
        </Authorized>
      )}

      {state.showQuickActionInspect && (
        <Authorized authorizations="DockerTaskInspect">
          <Link
            to="docker.tasks.task"
            params={{ id: taskId }}
            title="Inspect"
            data-cy="docker-task-inspect-link"
          >
            <Icon icon={Info} className="space-right" />
          </Link>
        </Authorized>
      )}
    </div>
  );
}
