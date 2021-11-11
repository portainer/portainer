import clsx from 'clsx';

import { Authorized } from '@/portainer/hooks/useUser';
import { Link } from '@/portainer/components/Link';
import { react2angular } from '@/react-tools/react2angular';
import { DockerContainerStatus } from '@/docker/containers/types';

import styles from './ContainerQuickActions.module.css';

interface QuickActionsState {
  showQuickActionAttach: boolean;
  showQuickActionExec: boolean;
  showQuickActionInspect: boolean;
  showQuickActionLogs: boolean;
  showQuickActionStats: boolean;
}

interface Props {
  taskId?: string;
  containerId?: string;
  nodeName: string;
  state: QuickActionsState;
  status: DockerContainerStatus;
}

export function ContainerQuickActions({
  taskId,
  containerId,
  nodeName,
  state,
  status,
}: Props) {
  if (taskId) {
    return <TaskQuickActions taskId={taskId} state={state} />;
  }

  const isActive = ['starting', 'running', 'healthy', 'unhealthy'].includes(
    status
  );

  return (
    <div
      className={clsx('btn-group btn-group-xs space-x-1', styles.root)}
      role="group"
    >
      {state.showQuickActionLogs && (
        <Authorized authorizations="DockerContainerLogs">
          <Link
            to="docker.containers.container.logs"
            params={{ id: containerId, nodeName }}
            title="Logs"
          >
            <i className="fa fa-file-alt space-right" aria-hidden="true" />
          </Link>
        </Authorized>
      )}

      {state.showQuickActionInspect && (
        <Authorized authorizations="DockerContainerInspect">
          <Link
            to="docker.containers.container.inspect"
            params={{ id: containerId, nodeName }}
            title="Inspect"
          >
            <i className="fa fa-info-circle space-right" aria-hidden="true" />
          </Link>
        </Authorized>
      )}

      {state.showQuickActionStats && isActive && (
        <Authorized authorizations="DockerContainerStats">
          <Link
            to="docker.containers.container.stats"
            params={{ id: containerId, nodeName }}
            title="Stats"
          >
            <i className="fa fa-chart-area space-right" aria-hidden="true" />
          </Link>
        </Authorized>
      )}

      {state.showQuickActionExec && isActive && (
        <Authorized authorizations="DockerExecStart">
          <Link
            to="docker.containers.container.exec"
            params={{ id: containerId, nodeName }}
            title="Exec Console"
          >
            <i className="fa fa-terminal space-right" aria-hidden="true" />
          </Link>
        </Authorized>
      )}

      {state.showQuickActionAttach && isActive && (
        <Authorized authorizations="DockerContainerAttach">
          <Link
            to="docker.containers.container.attach"
            params={{ id: containerId, nodeName }}
            title="Attach Console"
          >
            <i className="fa fa-plug space-right" aria-hidden="true" />
          </Link>
        </Authorized>
      )}
    </div>
  );
}

interface TaskProps {
  taskId: string;
  state: QuickActionsState;
}

function TaskQuickActions({ taskId, state }: TaskProps) {
  return (
    <div
      className={clsx('btn-group btn-group-xs space-x-1', styles.root)}
      role="group"
    >
      {state.showQuickActionLogs && (
        <Authorized authorizations="DockerTaskLogs">
          <Link
            to="docker.tasks.task.logs"
            params={{ id: taskId }}
            title="Logs"
          >
            <i className="fa fa-file-alt space-right" aria-hidden="true" />
          </Link>
        </Authorized>
      )}

      {state.showQuickActionInspect && (
        <Authorized authorizations="DockerTaskInspect">
          <Link to="docker.tasks.task" params={{ id: taskId }} title="Inspect">
            <i className="fa fa-info-circle space-right" aria-hidden="true" />
          </Link>
        </Authorized>
      )}
    </div>
  );
}

export const ContainerQuickActionsAngular = react2angular(
  ContainerQuickActions,
  ['taskId', 'containerId', 'nodeName', 'state', 'status']
);
