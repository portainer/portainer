import clsx from 'clsx';
import { ReactNode } from 'react';

import { Link } from '@@/Link';

import { TypeBadge, PlatformBadge } from '../../../components/StatusBadge';
import {
  WorkflowSourcesResult,
  SourceQueryResult,
} from '../../queries/useWorkflowSources';
import {
  WorkflowArtifact,
  WorkflowArtifactFile,
  WorkflowStatus,
} from '../../types';
import { getDeployedStackLink, getSourceLink } from '../../utils';

import { Block, Dot } from './Block';
import { TargetCell } from './TargetCell';

export function WorkflowSubRow({
  artifact,
  sources,
  showHeader,
}: {
  artifact: WorkflowArtifact;
  sources: WorkflowSourcesResult;
  showHeader: boolean;
}) {
  const artifactSources = getArtifactSources(artifact, sources);

  return (
    <div className="overflow-hidden rounded border border-solid border-gray-3 text-xs th-dark:border-gray-9">
      {showHeader && (
        <div className="flex items-center gap-2 border-0 border-b border-solid border-gray-3 bg-gray-2 px-4 py-2 th-dark:border-gray-9 th-dark:bg-gray-iron-11">
          <span className="font-semibold text-gray-9 th-highcontrast:text-white th-dark:text-white">
            {artifact.name}
          </span>
          <TypeBadge type={artifact.type} />
          <PlatformBadge platform={artifact.platform} />
        </div>
      )}
      <table className="w-full table-fixed border-collapse">
        <thead className="border-0 border-b border-solid border-gray-3 bg-gray-2 th-dark:border-gray-9 th-dark:bg-gray-iron-11">
          <tr>
            <Th>Source</Th>
            <Th divider>Artifacts</Th>
            <Th divider>Targets</Th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <Td>
              <div className="flex flex-col gap-1.5">
                {artifactSources.length > 0 ? (
                  artifactSources.map(({ sourceId, query }) => (
                    <SourceCell
                      key={sourceId}
                      sourceId={sourceId}
                      query={query}
                      status={artifact.status.source.status}
                    />
                  ))
                ) : (
                  <span className="text-gray-5">No source</span>
                )}
              </div>
            </Td>
            <Td divider>
              <ArtifactCell
                artifact={artifact}
                files={artifact.files}
                status={artifact.status.artifact.status}
              />
            </Td>
            <Td divider>
              <TargetCell
                target={artifact.target}
                type={artifact.type}
                status={artifact.status.target.status}
              />
            </Td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function SourceCell({
  sourceId,
  query,
  status,
}: {
  sourceId: number;
  query: SourceQueryResult;
  status: WorkflowStatus;
}) {
  const source = query.data;

  const content = (
    <Block status={status} className="flex items-start gap-2">
      <Dot status={status} className="mt-1.5" />
      <div className="min-w-0">
        <p className="m-0 font-semibold text-gray-9 th-highcontrast:text-white th-dark:text-white">
          {source?.name ?? 'Unknown source'}
        </p>
        {source?.url && (
          <p className="m-0 mt-0.5 break-all text-gray-7 th-highcontrast:text-gray-3 th-dark:text-gray-3">
            {source.url}
          </p>
        )}
      </div>
    </Block>
  );

  const sourceLink = getSourceLink(sourceId);
  return (
    <Link
      to={sourceLink.to}
      params={sourceLink.params}
      data-cy={`workflow-source-link-${sourceId}`}
      className="block no-underline hover:no-underline"
    >
      {content}
    </Link>
  );
}

function ArtifactCell({
  artifact,
  files,
  status,
}: {
  artifact: WorkflowArtifact;
  files: WorkflowArtifactFile[];
  status: WorkflowStatus;
}) {
  const content = (
    <Block status={status} className="flex flex-col gap-1">
      {files.length > 0 ? (
        files.map((file, index) => (
          <div
            key={`${file.sourceId}-${index}`}
            className="flex items-center gap-2"
          >
            <Dot status={status} />
            <span className="break-all font-mono text-gray-7 th-highcontrast:text-gray-3 th-dark:text-gray-4">
              {file.path}
            </span>
          </div>
        ))
      ) : (
        <span className="text-gray-5">No files</span>
      )}
    </Block>
  );

  const stackLink = getDeployedStackLink(artifact);
  if (!stackLink) {
    return content;
  }

  return (
    <Link
      to={stackLink.to}
      params={stackLink.params}
      data-cy={`workflow-artifact-link-${artifact.id}`}
      className="block no-underline hover:no-underline"
    >
      {content}
    </Link>
  );
}

function Th({ children, divider }: { children: ReactNode; divider?: boolean }) {
  return (
    <th
      className={clsx(
        'w-1/3 px-4 py-2 text-left text-sm font-semibold uppercase tracking-wider text-gray-7 th-highcontrast:text-white th-dark:text-white',
        divider &&
          'border-0 border-l border-solid border-gray-3 th-dark:border-gray-9'
      )}
    >
      {children}
    </th>
  );
}

function Td({
  children,
  divider,
}: {
  children?: ReactNode;
  divider?: boolean;
}) {
  return (
    <td
      className={clsx(
        'px-4 py-3 align-top',
        divider &&
          'border-0 border-l border-solid border-gray-3 th-dark:border-gray-8'
      )}
    >
      {children}
    </td>
  );
}

function getArtifactSources(
  artifact: WorkflowArtifact,
  sources: WorkflowSourcesResult
): WorkflowSourcesResult {
  const artifactSourceIds = new Set(
    artifact.files.map((file) => file.sourceId)
  );

  return sources.filter(({ sourceId }) => artifactSourceIds.has(sourceId));
}
