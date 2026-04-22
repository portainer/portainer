import { ReactNode } from 'react';
import { LayoutGridIcon } from 'lucide-react';

import { useEnvironment } from '@/react/portainer/environments/queries';
import {
  getDashboardRoute,
  getEnvironmentTypeIcon,
} from '@/react/portainer/environments/utils';
import { useEdgeGroup } from '@/react/edge/edge-groups/queries/useEdgeGroup';

import { Icon } from '@@/Icon';
import { Link } from '@@/Link';

import { WorkflowStatus, WorkflowTarget, WorkflowType } from '../types';

import { Block, Dot } from './Block';

export function TargetCell({
  target,
  type,
  status,
}: {
  target: WorkflowTarget;
  type: WorkflowType;
  status: WorkflowStatus;
}) {
  if (type === 'edgeStack') {
    return (
      <div className="flex flex-col gap-1.5">
        {target.edgeGroupIds?.map((id) => (
          <EdgeGroupTarget
            key={id}
            id={id}
            status={target.groupStatus?.[id] ?? status}
          />
        ))}
      </div>
    );
  }

  return <StackTarget target={target} status={status} />;
}

function EdgeGroupTarget({
  id,
  status,
}: {
  id: number;
  status: WorkflowStatus;
}) {
  const { data } = useEdgeGroup(id);
  const name = data?.Name ?? `Edge Group ${id}`;
  return (
    <TargetRow
      icon={
        <Icon
          icon={LayoutGridIcon}
          size="xs"
          className="shrink-0 text-gray-6"
        />
      }
      status={status}
    >
      <Link
        to="edge.groups.edit"
        params={{ groupId: id }}
        data-cy={`workflow-edge-group-link-${id}`}
        className="tracking-wider text-gray-9 th-highcontrast:text-white th-dark:text-white"
      >
        {name}
      </Link>
    </TargetRow>
  );
}

function StackTarget({
  target,
  status,
}: {
  target: WorkflowTarget;
  status: WorkflowStatus;
}) {
  const { data: environment } = useEnvironment(target.endpointId);

  if (!target.endpointId) {
    return <span className="text-gray-5">No target</span>;
  }

  const envName = environment?.Name ?? `Environment ${target.endpointId}`;
  const icon = environment
    ? getEnvironmentTypeIcon(environment.Type)
    : 'circle';
  const label = target.namespace ? `${envName} / ${target.namespace}` : envName;
  const dashboardRoute = environment
    ? getDashboardRoute(environment)
    : { to: '', params: {} };

  return (
    <TargetRow
      icon={<Icon icon={icon} size="xs" className="shrink-0 text-gray-6" />}
      status={status}
    >
      <Link
        to={dashboardRoute.to}
        params={dashboardRoute.params}
        data-cy={`workflow-environment-link-${target.endpointId}`}
        className="tracking-wider text-gray-9 th-highcontrast:text-white th-dark:text-white"
      >
        {label}
      </Link>
    </TargetRow>
  );
}

function TargetRow({
  icon,
  status,
  children,
}: {
  icon: ReactNode;
  status: WorkflowStatus;
  children: ReactNode;
}) {
  return (
    <Block status={status} className="flex items-center gap-2">
      <Dot status={status} />
      {icon}
      {children}
    </Block>
  );
}
