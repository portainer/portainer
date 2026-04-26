import clsx from 'clsx';
import { ReactNode } from 'react';

import { Workflow, WorkflowStatus } from '../types';

import { Block, Dot } from './Block';
import { TargetCell } from './TargetCell';
import { deriveSubRowStatuses } from './status';

export function WorkflowSubRow({ item }: { item: Workflow }) {
  const status = deriveSubRowStatuses(item);

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
                  name={item.name}
                  url={item.gitConfig.URL}
                  status={status.source}
                />
              )}
            </Td>
            <Td divider>
              {item.gitConfig && (
                <ArtifactCell
                  path={item.gitConfig.ConfigFilePath}
                  status={status.artifact}
                />
              )}
            </Td>
            <Td divider rowSpan={9999}>
              <TargetCell
                target={item.target}
                type={item.type}
                status={status.target}
              />
            </Td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function SourceCell({
  name,
  url,
  status,
}: {
  name: string;
  url: string;
  status: WorkflowStatus;
}) {
  return (
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
}

function ArtifactCell({
  path,
  status,
}: {
  path: string;
  status: WorkflowStatus;
}) {
  return (
    <Block status={status} className="flex items-center gap-2">
      <Dot status={status} />
      <span className="font-mono text-gray-7 th-highcontrast:text-gray-3 th-dark:text-gray-4">
        {path}
      </span>
    </Block>
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
