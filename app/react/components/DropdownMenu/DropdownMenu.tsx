import React from 'react';
import { ChevronDown, Loader2 } from 'lucide-react';
import {
  Menu,
  MenuButton as ReachMenuButton,
  MenuList,
  MenuItem,
} from '@reach/menu-button';
import clsx from 'clsx';

export interface DropdownOption {
  key: string;
  label?: string;
  count?: number;
  icon?: React.ReactNode;
}

interface Props {
  label: string;
  options: DropdownOption[] | undefined;
  selected: string | null;
  onSelect: (key: string | null) => void;
  badge?: string | null;
  onClick?: () => void;
  className?: string;
  'aria-pressed'?: boolean;
  'data-cy'?: string;
}

const menuListStyles =
  'mt-1 overflow-hidden rounded-lg ' +
  'shadow-[0_6px_12px_rgba(0,0,0,0.18)] ' +
  '!border !border-solid !border-gray-5 th-dark:!border-gray-8 th-highcontrast:!border-gray-7 ' +
  'bg-white th-dark:bg-gray-iron-11 th-highcontrast:bg-black';

const menuItemBase =
  'flex items-center gap-2 w-full border-none px-3 py-1.5 text-left text-sm whitespace-nowrap bg-transparent cursor-pointer';

const menuItemSelected =
  '!bg-blue-2 text-blue-8 [&[data-selected]]:!bg-blue-2 [&[data-selected]]:!text-blue-8 ' +
  'th-dark:!bg-blue-8 th-dark:text-blue-4 th-dark:[&[data-selected]]:!bg-blue-8 th-dark:[&[data-selected]]:!text-blue-4 ' +
  'th-highcontrast:!bg-blue-8 th-highcontrast:!text-white th-highcontrast:[&[data-selected]]:!bg-blue-8 th-highcontrast:[&[data-selected]]:!text-white';

const menuItemUnselected =
  'hover:bg-gray-3 [&[data-selected]]:!bg-gray-3 [&[data-selected]]:!text-gray-9 ' +
  'th-dark:hover:bg-gray-8 th-dark:[&[data-selected]]:!bg-gray-8 th-dark:[&[data-selected]]:!text-white ' +
  'th-highcontrast:text-white th-highcontrast:hover:bg-white th-highcontrast:hover:text-black th-highcontrast:[&[data-selected]]:!bg-white th-highcontrast:[&[data-selected]]:!text-black';

const countBadge =
  'inline-flex items-center justify-center min-w-[1.25rem] h-5 rounded-full px-1 text-xs font-normal ' +
  'bg-gray-4 text-gray-9 ' +
  'th-dark:bg-gray-7 th-dark:text-gray-3 ' +
  'th-highcontrast:bg-blue-8 th-highcontrast:text-white';

export function DropdownMenu({
  label,
  options,
  selected,
  onSelect,
  badge,
  onClick,
  className,
  'aria-pressed': ariaPressed,
  'data-cy': dataCy,
}: Props) {
  return (
    <Menu>
      <ReachMenuButton
        className={clsx('group flex gap-1', className)}
        onClick={() => onClick?.()}
        aria-pressed={ariaPressed}
        data-cy={dataCy}
      >
        {label}
        {badge && (
          <span className="py-0.2 ml-1 rounded-md bg-blue-7 px-1 text-[10px] font-normal text-white">
            {badge}
          </span>
        )}
        <ChevronDown
          className="ml-1 h-3 w-3 self-center transition-transform group-[[aria-expanded=true]]:rotate-180"
          aria-hidden="true"
        />
      </ReachMenuButton>
      <MenuList className={menuListStyles}>
        {typeof options === 'undefined' ? (
          <div className="flex items-center justify-center gap-2 px-3 py-3 text-sm text-gray-6">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Loading...
          </div>
        ) : (
          <>
            <MenuItem
              onSelect={() => onSelect(null)}
              className={clsx(
                menuItemBase,
                !selected ? menuItemSelected : menuItemUnselected
              )}
            >
              <span className="flex-1">All</span>
            </MenuItem>
            <div
              className="h-px bg-gray-4 th-highcontrast:bg-gray-7 th-dark:bg-gray-8"
              role="separator"
            />
            {options.map((option) => (
              <MenuItem
                key={option.key}
                onSelect={() => onSelect(option.key)}
                className={clsx(
                  menuItemBase,
                  selected === option.key
                    ? menuItemSelected
                    : menuItemUnselected
                )}
              >
                {option.icon && (
                  <span className="flex h-4 w-4 shrink-0 items-center justify-center">
                    {option.icon}
                  </span>
                )}
                <span className="flex-1">{option.label ?? option.key}</span>
                {option.count !== undefined && (
                  <span className={countBadge}>{option.count}</span>
                )}
              </MenuItem>
            ))}
          </>
        )}
      </MenuList>
    </Menu>
  );
}
