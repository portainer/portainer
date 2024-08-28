import { ChevronDown } from 'lucide-react';
import { ComponentProps } from 'react';
import clsx from 'clsx';

import { Icon } from './Icon';

export function CollapseExpandButton({
  onClick,
  isExpanded,
  ...props
}: { isExpanded: boolean } & ComponentProps<'button'>) {
  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();

        onClick?.(e);
      }}
      color="none"
      title={isExpanded ? 'Collapse' : 'Expand'}
      aria-label={isExpanded ? 'Collapse' : 'Expand'}
      aria-expanded={isExpanded}
      type="button"
      className="flex-none border-none bg-transparent flex items-center p-0 !ml-0 group"
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...props}
    >
      <div className="flex items-center group-hover:bg-blue-5 be:group-hover:bg-gray-5 group-hover:th-dark:bg-gray-true-7 group-hover:bg-opacity-10 be:group-hover:bg-opacity-10 rounded-full p-[3px] transition ease-in-out">
        <Icon
          icon={ChevronDown}
          size="md"
          className={clsx('transition ease-in-out', {
            'rotate-180': isExpanded,
            'rotate-0': !isExpanded,
          })}
        />
      </div>
    </button>
  );
}
