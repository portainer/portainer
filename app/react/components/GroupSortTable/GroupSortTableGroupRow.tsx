import React from 'react';

interface Props {
  groupName: string;
  groupDescription?: string;
  groupIcon: React.ReactNode;
  count?: number;
}

export function GroupSortTableGroupRow({
  groupName,
  groupDescription,
  groupIcon,
  count,
}: Props) {
  return (
    <div className="flex items-center gap-3 bg-gray-2 px-4 py-3 th-highcontrast:bg-black th-dark:bg-gray-iron-10">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center">
        {groupIcon}
      </div>
      <div className="flex min-w-0 flex-col gap-0.5">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-semibold text-gray-11 th-highcontrast:text-white th-dark:text-white">
            {groupName}
          </span>
          {count !== undefined && (
            <span className="inline-flex items-center justify-center rounded-full bg-gray-4 px-2 py-0.5 text-xs font-medium text-gray-9 th-highcontrast:bg-black th-highcontrast:text-white th-dark:bg-gray-7 th-dark:text-gray-3">
              {count}
            </span>
          )}
        </div>
        {groupDescription && (
          <span className="truncate text-xs text-gray-7 th-highcontrast:text-white th-dark:text-gray-5">
            {groupDescription}
          </span>
        )}
      </div>
    </div>
  );
}
