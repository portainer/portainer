import { FileText, Info } from 'lucide-react';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();

  return (
    <div className="inline-flex space-x-1">
      {state.showQuickActionLogs && (
        <Authorized authorizations="DockerTaskLogs">
          <Link
            to="docker.tasks.task.logs"
            params={{ id: taskId }}
            title={t('docker.services.quick_actions.logs')}
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
            title={t('docker.services.quick_actions.inspect')}
            data-cy="docker-task-inspect-link"
          >
            <Icon icon={Info} className="space-right" />
          </Link>
        </Authorized>
      )}
    </div>
  );
}
