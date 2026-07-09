import clsx from 'clsx';
import { ReactNode } from 'react';

import { Link } from '@@/Link';

import { Workflow, WorkflowStatus } from '../../types';
import { getDeployedStackLink, getSourceLink } from '../../utils';

import { Block, Dot } from './Block';
import { TargetCell } from './TargetCell';

export function WorkflowSubRow({ item }: { item: Workflow }) {
  return (
    <div className="overflow-hidden rounded border border-solid border-gray-3 text-xs th-dark:border-gray-9">
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
              {item.gitConfig && (
                <SourceCell
                  sourceId={item.sourceId}
                  name={item.name}
                  url={item.gitConfig.URL}
                  status={item.status.source.status}
                />
              )}
            </Td>
            <Td divider>
              {item.gitConfig && (
                <ArtifactCell
                  item={item}
                  path={item.gitConfig.ConfigFilePath}
                  status={item.status.artifact.status}
                />
              )}
            </Td>
            <Td divider rowSpan={9999}>
              <TargetCell
                target={item.target}
                type={item.type}
                status={item.status.target.status}
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
  name,
  url,
  status,
}: {
  sourceId: number | undefined;
  name: string;
  url: string;
  status: WorkflowStatus;
}) {
  const content = (
    <Block status={status} className="flex items-start gap-2">
      <Dot status={status} className="mt-1.5" />
      <div className="min-w-0">
        <p className="m-0 font-semibold text-gray-9 th-highcontrast:text-white th-dark:text-white">
          {name}
        </p>
        <p className="m-0 mt-0.5 break-all text-gray-7 th-highcontrast:text-gray-3 th-dark:text-gray-3">
          {url}
        </p>
      </div>
    </Block>
  );

  if (sourceId === undefined) {
    return content;
  }

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
  item,
  path,
  status,
}: {
  item: Workflow;
  path: string;
  status: WorkflowStatus;
}) {
  const content = (
    <Block status={status} className="flex items-center gap-2">
      <Dot status={status} />
      <span className="font-mono text-gray-7 th-highcontrast:text-gray-3 th-dark:text-gray-4">
        {path}
      </span>
    </Block>
  );

  const stackLink = getDeployedStackLink(item);
  if (!stackLink) {
    return content;
  }

  return (
    <Link
      to={stackLink.to}
      params={stackLink.params}
      data-cy={`workflow-artifact-link-${item.id}`}
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
  rowSpan,
}: {
  children?: ReactNode;
  divider?: boolean;
  rowSpan?: number;
}) {
  return (
    <td
      className={clsx(
        'px-4 py-3 align-top',
        divider &&
          'border-0 border-l border-solid border-gray-3 th-dark:border-gray-8'
      )}
      rowSpan={rowSpan}
    >
      {children}
    </td>
  );
}
