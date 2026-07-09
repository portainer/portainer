import { FileTextIcon } from 'lucide-react';

import { WorkflowsArtifactFileDetail } from '@api/types.gen';

import { Card } from '@@/primitives/Card';
import { Badge } from '@@/Badge';

import { WorkflowSourcesResult } from '../queries/useWorkflowSources';
import { WorkflowArtifact } from '../types';

interface Props {
  artifacts: WorkflowArtifact[];
  sources: WorkflowSourcesResult;
}

interface FileGroup {
  sourceId: number;
  files: WorkflowsArtifactFileDetail[];
}

function groupFilesBySource(artifacts: WorkflowArtifact[]): FileGroup[] {
  const groups = new Map<number, WorkflowsArtifactFileDetail[]>();

  artifacts
    .flatMap((artifact) => artifact.files)
    .forEach((file) => {
      const files = groups.get(file.sourceId) ?? [];
      files.push(file);
      groups.set(file.sourceId, files);
    });

  return [...groups.entries()].map(([sourceId, files]) => ({
    sourceId,
    files,
  }));
}

export function FilesSection({ artifacts, sources }: Props) {
  const groups = groupFilesBySource(artifacts);
  const sourceNames = new Map(
    sources.map(({ sourceId, query }) => [sourceId, query.data?.name])
  );

  return (
    <Card.Container aria-label="Files">
      <Card.Header
        icon={FileTextIcon}
        title="Files"
        actions={<Badge type="muted">{groups.length}</Badge>}
      />
      <ul className="m-0 list-none divide-y divide-solid divide-gray-3 p-0 th-dark:divide-gray-9">
        {groups.map((group) => (
          <FileGroupRow
            key={group.sourceId}
            group={group}
            sourceName={sourceNames.get(group.sourceId)}
          />
        ))}
      </ul>
    </Card.Container>
  );
}

function FileGroupRow({
  group,
  sourceName,
}: {
  group: FileGroup;
  sourceName: string | undefined;
}) {
  return (
    <li className="px-4 py-3">
      <p className="m-0 font-semibold text-gray-9 th-highcontrast:text-white th-dark:text-white">
        {sourceName ?? 'Unknown source'}
      </p>
      <ul className="m-0 mt-1 list-none space-y-1 p-0">
        {group.files.map((file) => (
          <li
            key={`${file.path}-${file.ref}`}
            className="flex items-center gap-2 font-mono text-xs text-gray-7 th-highcontrast:text-gray-3 th-dark:text-gray-4"
          >
            <span>{file.path}</span>
            <span className="text-gray-5">@ {file.ref}</span>
          </li>
        ))}
      </ul>
    </li>
  );
}
