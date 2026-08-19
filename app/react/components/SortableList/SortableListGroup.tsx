import { Fragment, ReactNode } from 'react';
import clsx from 'clsx';

export interface SortableGroup<T> {
  key: string;
  label: string;
  description?: string;
  icon?: ReactNode;
  items: T[];
}

interface Props<T> {
  group: SortableGroup<T>;
  showHeader: boolean;
  renderItem: (item: T, index: number) => ReactNode;
  renderColumnHeaders?: (groupKey: string, items: T[]) => ReactNode;
  getItemKey?: (item: T, index: number) => string | number;
}

export function SortableListGroup<T>({
  group,
  showHeader,
  renderItem,
  renderColumnHeaders,
  getItemKey,
}: Props<T>) {
  return (
    <div>
      {showHeader && <SortableListGroupHeader group={group} />}

      {renderColumnHeaders && (
        <div>{renderColumnHeaders(group.key, group.items)}</div>
      )}

      <div>
        {group.items.map((item, index) => (
          <Fragment key={getItemKey ? getItemKey(item, index) : index}>
            {renderItem(item, index)}
          </Fragment>
        ))}
      </div>
    </div>
  );
}

interface HeaderProps<T> {
  group: SortableGroup<T>;
}

function SortableListGroupHeader<T>({ group }: HeaderProps<T>) {
  const groupName = group.label ? group.label : group.key;
  const groupIcon = group.icon;
  const count = group.items.length;
  const groupDescription = group.description;

  return (
    <div
      className={clsx(
        'flex items-center gap-3 bg-gray-2 px-4 py-3 th-highcontrast:bg-black th-dark:bg-gray-iron-10',
        'border-0 border-b border-solid border-gray-5 th-highcontrast:border-white th-dark:border-gray-9'
      )}
    >
      {groupIcon && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center">
          {groupIcon}
        </div>
      )}
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
