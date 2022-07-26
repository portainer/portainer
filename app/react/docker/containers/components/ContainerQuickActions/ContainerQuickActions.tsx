import clsx from 'clsx';

import { DockerContainerStatus } from '@/react/docker/containers/types';
import { Authorized } from '@/portainer/hooks/useUser';
import { Icon } from '@/react/components/Icon';
import { react2angular } from '@/react-tools/react2angular';

import { Link } from '@@/Link';

import styles from './ContainerQuickActions.module.css';

interface QuickActionsState {
  showQuickActionAttach: boolean;
  showQuickActionExec: boolean;
  showQuickActionInspect: boolean;
  showQuickActionLogs: boolean;
  showQuickActionStats: boolean;
  showQuickActionExplorer: boolean;
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
    <div className={clsx('space-x-1', styles.root)}>
      {state.showQuickActionLogs && (
        <Authorized authorizations="DockerContainerLogs">
          <Link
            to="docker.containers.container.logs"
            params={{ id: containerId, nodeName }}
            title="Logs"
          >
            <Icon icon="file-text" feather className="space-right" />
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
            <Icon icon="info" feather className="space-right" />
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
            <Icon icon="bar-chart" feather className="space-right" />
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
            <Icon icon="terminal" feather className="space-right" />
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
            <Icon icon="paperclip" feather className="space-right" />
          </Link>
        </Authorized>
      )}

      {state.showQuickActionExplorer && isActive && (
        <Authorized authorizations="DockerContainerExplorer">
          <Link
            to="docker.containers.container.explorer"
            params={{ id: containerId, nodeName }}
            title="explorer"
          >
            <i className="fa fa-folder-open space-right" aria-hidden="true" />
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
    <div className={clsx('space-x-1', styles.root)}>
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
