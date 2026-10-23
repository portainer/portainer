import { CrosshairIcon } from 'lucide-react';

import { Card } from '@@/primitives/Card';
import { Badge } from '@@/Badge';
import { Alert } from '@@/Alert';

import { TargetCell } from '../ListView/WorkflowSubRow/TargetCell';
import { computeArtifactTargetCount } from '../status';
import { WorkflowArtifact } from '../types';

interface Props {
  artifacts: WorkflowArtifact[];
}

export function TargetsSection({ artifacts }: Props) {
  const targetCount = artifacts.reduce(
    (sum, artifact) => sum + computeArtifactTargetCount(artifact),
    0
  );

  return (
    <Card.Container aria-label="Targets">
      <Card.Header
        icon={CrosshairIcon}
        title="Targets"
        actions={<Badge type="muted">{targetCount}</Badge>}
      />
      <div className="divide-y divide-solid divide-gray-3 th-dark:divide-gray-9">
        {artifacts.map((artifact) => (
          <TargetRow key={artifact.id} artifact={artifact} />
        ))}
      </div>
    </Card.Container>
  );
}

function TargetRow({ artifact }: { artifact: WorkflowArtifact }) {
  return (
    <div
      className="flex flex-col gap-2 px-4 py-3"
      data-cy={`workflow-target-row-${artifact.id}`}
    >
      <p className="m-0 text-xs font-semibold uppercase tracking-wide text-gray-6 th-dark:text-gray-6">
        {artifact.name}
      </p>
      <TargetCell
        target={artifact.target}
        type={artifact.type}
        status={artifact.status.target.status}
      />
      {artifact.status.target.error && (
        <Alert color="error">{artifact.status.target.error}</Alert>
      )}
    </div>
  );
}
