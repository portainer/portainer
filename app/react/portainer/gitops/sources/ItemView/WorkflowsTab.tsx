import { ChevronRight, GitCommitIcon, LayoutGridIcon } from 'lucide-react';
import moment from 'moment';

import { addPlural } from '@/react/common/string-utils';

import { Card } from '@@/primitives/Card';
import { Icon } from '@@/Icon';
import { Link } from '@@/Link';

import { WorkflowTarget, WorkflowType } from '../../workflows/types';
import { StatusBadge } from '../../components/StatusBadge';
import { getWorkflowLink } from '../../workflows/utils';
import { effectiveWorkflowStatus } from '../../workflows/status';
import {
  SourceWorkflow,
  useSourceWorkflows,
} from '../queries/useSourceWorkflows';
import { Source } from '../types';

interface Props {
  sourceId: Source['id'];
}

export function WorkflowsTab({ sourceId }: Props) {
  const workflowsQuery = useSourceWorkflows(sourceId);
  const workflows = workflowsQuery.data;

  return (
    <Card.Container>
      <Card.Header
        icon={GitCommitIcon}
        title="Workflows"
        subtitle={
          workflows
            ? `${addPlural(workflows.length, 'workflow')} using this source`
            : undefined
        }
      />

      <WorkflowsBody
        workflows={workflows}
        isLoading={workflowsQuery.isLoading}
      />
    </Card.Container>
  );
}

function WorkflowsBody({
  workflows,
  isLoading,
}: {
  workflows: Array<SourceWorkflow> | undefined;
  isLoading: boolean;
}) {
  if (isLoading) {
    return <WorkflowsSkeleton />;
  }

  if (!workflows) {
    return (
      <Card.Body>
        <p className="text-muted text-sm">Unable to load workflows.</p>
      </Card.Body>
    );
  }

  if (workflows.length === 0) {
    return (
      <Card.Body>
        <p className="text-muted text-sm">
          No workflows are using this source.
        </p>
      </Card.Body>
    );
  }

  return <WorkflowsList workflows={workflows} />;
}

function WorkflowsSkeleton() {
  return (
    <div className="space-y-2 p-4">
      {Array.from({ length: 3 }).map((_, index) => (
        <div
          key={index}
          className="h-16 animate-pulse rounded-lg bg-gray-3 th-dark:bg-gray-8"
        />
      ))}
    </div>
  );
}

function WorkflowsList({ workflows }: { workflows: Array<SourceWorkflow> }) {
  return (
    <div className="space-y-2">
      {workflows.map((wf) => (
        <WorkflowCard key={wf.id} item={wf} />
      ))}
    </div>
  );
}

function WorkflowCard({ item }: { item: SourceWorkflow }) {
  const { to, params } = getWorkflowLink(item);

  return (
    <Link
      className="group flex items-center gap-3 p-4 text-inherit hover:bg-cyan-4/10 hover:text-current hover:!no-underline"
      to={to}
      params={params}
      data-cy="workflow-item"
    >
      <div className="me-3 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-4 text-blue-7">
        <Icon icon={GitCommitIcon} size="lg" />
      </div>
      <div className="flex flex-1 flex-col">
        <div className="flex items-center gap-3">
          <h6 className="m-0 text-sm font-medium tracking-wider">
            {item.name}
          </h6>
          <StatusBadge status={effectiveWorkflowStatus(item).status} />
        </div>
        <div className="flex items-center gap-3">
          {item.gitConfig?.ConfigFilePath && (
            <code className="bg-transparent p-0">
              {item.gitConfig.ConfigFilePath}
            </code>
          )}
          <span>
            Last sync:{' '}
            {item.lastSyncDate
              ? moment.unix(item.lastSyncDate).fromNow()
              : 'Never'}
          </span>
        </div>
      </div>

      <TargetBlock target={item.target} type={item.type} />
      <span className="text-gray-4 group-hover:text-gray-6">
        <Icon icon={ChevronRight} size="lg" />
      </span>
    </Link>
  );
}

function TargetBlock({
  target,
  type,
}: {
  target: WorkflowTarget;
  type: WorkflowType;
}) {
  return type === 'edgeStack' ? <EdgeStackTargetBlock target={target} /> : null;
}

function EdgeStackTargetBlock({ target }: { target: WorkflowTarget }) {
  return (
    <div className="flex items-center gap-2 rounded-md border border-solid border-gray-4 bg-gray-2 px-3 py-2 th-highcontrast:border-gray-11 th-highcontrast:bg-transparent th-dark:border-gray-8 th-dark:bg-gray-iron-10">
      <Icon icon={LayoutGridIcon} />
      <span className="font-bold text-graphite-700 th-highcontrast:text-white th-dark:text-white">
        {target.edgeGroupIds?.length ?? 0}
      </span>
      <span className="th-dark:text-gray text-xs text-gray-6 th-highcontrast:text-white th-dark:text-gray-6">
        Groups
      </span>
    </div>
  );
}
