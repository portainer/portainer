import clsx from 'clsx';

import { DropdownMenu, DropdownOption } from '../DropdownMenu/DropdownMenu';

export interface SortOption<TSortKey extends string = string> {
  key: TSortKey;
  label: string;
  grouped?: boolean;
  descendingLabel?: string;
  ascendingLabel?: string;
}

type Value<TSortKey> = {
  group: TSortKey;
  groupValue: string | null;
};

export interface SortByGroupProps<TSortKey extends string> {
  value: Value<TSortKey>;
  sortDesc: boolean;
  onChange: (value: Value<TSortKey>) => void;
  sortOptions: SortOption<TSortKey>[];
  groupOptions?: Record<string, DropdownOption[]>;
  dataCy?: string;
}

export function SortByGroup<TSortKey extends string>({
  value,
  sortDesc,
  onChange,
  sortOptions,
  groupOptions,
  dataCy,
}: SortByGroupProps<TSortKey>) {
  return (
    <div className="flex items-center gap-3">
      <span
        className="text-xs font-semibold tracking-wider text-gray-11 th-highcontrast:text-white th-dark:text-white"
        data-cy="sort-by-label"
      >
        SORT BY:
      </span>
      <div
        className={clsx(
          'flex',
          'bg-gray-4 th-highcontrast:bg-black th-dark:bg-gray-iron-11',
          'gap-1 rounded-md p-1 th-highcontrast:border th-highcontrast:border-solid th-highcontrast:border-white'
        )}
        role="group"
        aria-label="Sort by"
      >
        {sortOptions.map((option, index) => (
          <SortOptionItem
            key={option.key}
            option={option}
            isActive={value.group === option.key}
            sortDesc={sortDesc}
            isFirst={index === 0}
            isLast={index === sortOptions.length - 1}
            value={value}
            onChange={(value) => onChange(value)}
            groupOptions={groupOptions}
            dataCy={dataCy}
          />
        ))}
      </div>
    </div>
  );
}

const baseBtn = clsx(
  'px-4 py-1.5 align-middle text-xs font-medium transition-colors'
);
const activeBtn = clsx(
  'z-10 rounded-md border-none font-medium',
  'bg-white text-gray-8',
  'th-dark:bg-gray-iron-10 th-dark:text-white',
  'th-highcontrast:border th-highcontrast:border-solid th-highcontrast:bg-transparent th-highcontrast:text-white'
);
const inactiveBtn = clsx(
  'text-muted rounded-md border-none',
  'bg-gray-4 hover:bg-gray-2',
  'th-dark:bg-gray-iron-11 th-dark:text-white th-dark:hover:bg-gray-iron-9',
  'th-highcontrast:bg-black th-highcontrast:text-white th-highcontrast:hover:bg-white th-highcontrast:hover:text-black'
);

interface SortOptionItemProps<TSortKey extends string> {
  option: SortOption<TSortKey>;
  isActive: boolean;
  sortDesc: boolean;
  isFirst: boolean;
  isLast: boolean;
  value: Value<TSortKey>;
  onChange: (value: Value<TSortKey>) => void;
  groupOptions?: Record<string, DropdownOption[]>;
  dataCy?: string;
}

function SortOptionItem<TSortKey extends string>({
  option,
  isActive,
  sortDesc,
  isFirst,
  isLast,
  value,
  onChange,
  groupOptions,
  dataCy,
}: SortOptionItemProps<TSortKey>) {
  const className = clsx(
    baseBtn,
    isActive ? activeBtn : inactiveBtn,
    isFirst && 'rounded-l-md',
    isLast && 'rounded-r-md'
  );

  if (option.grouped) {
    return (
      <DropdownMenu
        label={option.label}
        options={groupOptions?.[option.key]}
        selected={isActive ? value.groupValue ?? null : null}
        onSelect={(selected) => {
          onChange({ group: option.key, groupValue: selected });
        }}
        badge={
          isActive
            ? getFilterBadge(groupOptions, option.key, value.groupValue ?? null)
            : undefined
        }
        className={className}
        aria-pressed={isActive}
        data-cy={`${dataCy}-sort-by-${option.key.toLowerCase()}-button`}
      />
    );
  }

  const badge = isActive
    ? sortDesc
      ? option.descendingLabel || 'Desc'
      : option.ascendingLabel || 'Asc'
    : null;

  return (
    <button
      type="button"
      className={className}
      aria-pressed={isActive}
      onClick={() => {
        onChange({ group: option.key, groupValue: null });
      }}
      data-cy={`${dataCy}-sort-by-${option.key.toLowerCase()}-button`}
    >
      {option.label}
      {badge && (
        <span className="py-0.2 ml-1 rounded-md bg-blue-7 px-1 text-[10px] font-normal text-white">
          {badge}
        </span>
      )}
    </button>
  );
}

function getFilterBadge(
  groupOptions: Record<string, DropdownOption[]> | undefined,
  groupKey: string,
  filter: string | null
): string | null {
  if (!filter) {
    return null;
  }

  const option = groupOptions?.[groupKey]?.find((o) => o.key === filter);
  if (!option) return null;
  return option.label ?? option.key;
}
