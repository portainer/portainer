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
      {showHeader && (
        <div
          className={clsx(
            'flex items-center gap-2 px-5 py-2.5',
            'bg-gray-2 th-highcontrast:bg-black th-dark:bg-gray-iron-11',
            'border-0 border-b border-solid border-gray-5 th-dark:border-gray-9'
          )}
        >
          {group.icon && (
            <span className="flex h-4 w-4 shrink-0 items-center justify-center text-gray-7">
              {group.icon}
            </span>
          )}
          <span className="text-xs font-semibold text-gray-9 th-highcontrast:text-white th-dark:text-gray-2">
            {group.label}
          </span>
          <span
            className={clsx(
              'rounded-full px-1.5 py-0.5 text-xs font-medium',
              'bg-gray-3 text-gray-7',
              'th-dark:bg-gray-7 th-dark:text-gray-3'
            )}
          >
            {group.items.length}
          </span>
          {group.description && (
            <span className="ml-1 text-xs text-gray-6">
              {group.description}
            </span>
          )}
        </div>
      )}

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
