import clsx from 'clsx';

import { AutomationTestingProps } from '@/types';

export type FilterBarColorScheme =
  | 'success'
  | 'error'
  | 'warning'
  | 'blue'
  | 'gray';

const colorSchemeStyles: Record<
  FilterBarColorScheme,
  { dot: string; text: string }
> = {
  success: { dot: 'bg-success-7', text: 'text-success-7' },
  error: { dot: 'bg-error-7', text: 'text-error-7' },
  warning: { dot: 'bg-warning-7', text: 'text-warning-7' },
  blue: { dot: 'bg-blue-7', text: 'text-blue-7' },
  gray: { dot: 'bg-gray-7', text: 'text-gray-7' },
};

interface Props extends AutomationTestingProps {
  count: number;
  label: string;
  isSelected: boolean;
  onClick: () => void;
  name: string;
  colorScheme?: FilterBarColorScheme;
}

export function FilterBarButton({
  count,
  label,
  isSelected,
  onClick,
  name,
  colorScheme,
  'data-cy': dataCy,
}: Props) {
  if (count === 0) {
    return null;
  }

  const colors = colorScheme ? colorSchemeStyles[colorScheme] : undefined;
  return (
    <label
      className={clsx(
        'relative mb-0 flex items-center gap-2',
        'px-8 py-3',
        'cursor-pointer border-0',
        'text-sm font-medium',
        'text-[var(--text-muted-color)]',
        'hover:bg-[var(--bg-blocklist-item-selected-color)]',
        'transition-colors duration-150',
        'has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-blue-5 has-[:focus-visible]:ring-inset',
        isSelected && 'bg-[var(--bg-blocklist-item-selected-color)]'
      )}
      data-cy={dataCy}
    >
      <input
        type="radio"
        className="sr-only"
        name={name}
        value={label}
        checked={isSelected}
        onClick={onClick}
        readOnly
        aria-label={`Filter by ${label}`}
        tabIndex={0}
      />
      {colors && (
        <span
          className={clsx('h-2.5 w-2.5 shrink-0 rounded-full', colors.dot)}
          aria-hidden="true"
        />
      )}
      {colors && (
        <span className="flex flex-col leading-tight">
          <span className={clsx('text-2xl font-bold', colors.text)}>
            {count}
          </span>
          <span className="text-xs uppercase tracking-wide text-[var(--text-muted-color)]">
            {label}
          </span>
        </span>
      )}
      {!colors && (
        <span className="flex items-baseline gap-2">
          <span className="text-2xl font-bold">{count}</span>
          <span className="text-base uppercase tracking-wide text-[var(--text-muted-color)]">
            {label}
          </span>
        </span>
      )}
      {isSelected && (
        <span
          className={clsx(
            'absolute bottom-0 left-0 right-0 h-1',
            colors?.dot || 'bg-blue-7'
          )}
          aria-hidden="true"
        />
      )}
    </label>
  );
}
