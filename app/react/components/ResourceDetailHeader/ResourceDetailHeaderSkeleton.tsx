import { Widget } from '@@/Widget';

import { ActionBarShell } from './ActionBarShell';

interface Props {
  statBlockCount?: 0 | 1 | 2;
  hasActionBar?: boolean;
}

export function ResourceDetailHeaderSkeleton({
  statBlockCount = 0,
  hasActionBar = true,
}: Props) {
  return (
    <Widget className="widget-body animate-pulse">
      <div className="flex items-center gap-4 p-6">
        <div className="h-14 w-14 shrink-0 rounded-lg bg-gray-3 th-dark:bg-gray-8" />

        <div className="flex flex-1 flex-col gap-2">
          <div className="h-3 w-24 rounded bg-gray-3 th-dark:bg-gray-8" />
          <div className="h-5 w-48 rounded bg-gray-3 th-dark:bg-gray-8" />
          <div className="h-3 w-64 rounded bg-gray-2 th-dark:bg-gray-9" />
        </div>

        {statBlockCount > 0 && (
          <div className="flex items-stretch gap-3">
            {Array.from({ length: statBlockCount }).map((_, i) => (
              <div
                key={i}
                className="flex min-w-[6rem] flex-col gap-2 rounded-md border border-solid border-gray-3 px-3 py-2 th-dark:border-gray-8"
              >
                <div className="h-3 w-12 rounded bg-gray-3 th-dark:bg-gray-8" />
                <div className="h-4 w-8 rounded bg-gray-2 th-dark:bg-gray-9" />
              </div>
            ))}
          </div>
        )}
      </div>

      {hasActionBar && (
        <ActionBarShell>
          <div className="flex gap-2">
            <div className="h-8 w-28 rounded bg-gray-3 th-dark:bg-gray-8" />
            <div className="h-8 w-20 rounded bg-gray-3 th-dark:bg-gray-8" />
          </div>
        </ActionBarShell>
      )}
    </Widget>
  );
}
