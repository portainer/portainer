import { LayersIcon, ArrowRightIcon } from 'lucide-react';

import { Card } from '@@/primitives/Card';
import { Icon } from '@@/Icon';
import { Badge } from '@@/Badge';
import { Link } from '@@/Link';

import { PlatformBadge } from '../../components/StatusBadge';
import { TargetCell } from '../ListView/WorkflowSubRow/TargetCell';
import { WorkflowArtifact } from '../types';
import { Dot } from '../ListView/WorkflowSubRow/Block';
import { getDeployedStackLink } from '../utils';

interface Props {
  artifacts: WorkflowArtifact[];
}

export function StacksSection({ artifacts }: Props) {
  return (
    <Card.Container aria-label="Stacks">
      <Card.Header
        icon={LayersIcon}
        title="Stacks"
        actions={<Badge type="muted">{artifacts.length}</Badge>}
      />
      <ul className="m-0 list-none divide-y divide-solid divide-gray-3 p-0 th-dark:divide-gray-9">
        {artifacts.map((artifact) => (
          <StackRow key={artifact.id} artifact={artifact} />
        ))}
      </ul>
    </Card.Container>
  );
}

function StackRow({ artifact }: { artifact: WorkflowArtifact }) {
  const status = artifact.status.artifact.status;
  const stackLink = getDeployedStackLink(artifact);

  return (
    <li className="flex items-center gap-4 px-4 py-3">
      <Dot status={status} />
      <div className="min-w-0 flex-1">
        <p className="m-0 truncate font-semibold">
          {stackLink ? (
            <Link
              to={stackLink.to}
              params={stackLink.params}
              data-cy={`workflow-stack-link-${artifact.id}`}
              className="text-gray-9 th-highcontrast:text-white th-dark:text-white"
            >
              {artifact.name}
            </Link>
          ) : (
            <span className="text-gray-9 th-highcontrast:text-white th-dark:text-white">
              {artifact.name}
            </span>
          )}
        </p>
        <p className="m-0 mt-0.5 flex items-center gap-1 truncate font-mono text-xs text-gray-7 th-highcontrast:text-gray-3 th-dark:text-gray-4">
          {artifact.files.map((file) => file.path).join(', ') || 'No files'}
        </p>
      </div>
      <PlatformBadge platform={artifact.platform} />
      <Icon icon={ArrowRightIcon} size="sm" className="shrink-0 text-gray-5" />
      <div className="w-56 shrink-0">
        <TargetCell
          target={artifact.target}
          type={artifact.type}
          status={artifact.status.target.status}
        />
      </div>
    </li>
  );
}
