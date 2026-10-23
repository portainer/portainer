import { ChevronDown } from 'lucide-react';
import { ComponentProps } from 'react';
import clsx from 'clsx';

import { Icon } from './Icon';

export function CollapseExpandButton({
  onClick,
  isExpanded,
  quarterRotation = false,
  ...props
}: {
  isExpanded: boolean;
  quarterRotation?: boolean;
} & ComponentProps<'button'>) {
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
      className="group !ml-0 flex flex-none items-center border-none bg-transparent p-0"
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...props}
    >
      <div className="flex items-center rounded-full p-[3px] transition ease-in-out group-hover:bg-blue-5 group-hover:bg-opacity-10 be:group-hover:bg-gray-5 be:group-hover:bg-opacity-10 group-hover:th-dark:bg-gray-true-7">
        <Icon
          icon={ChevronDown}
          size="md"
          className={clsx('transition ease-in-out', {
            'rotate-180': isExpanded && !quarterRotation,
            '-rotate-90': !isExpanded && quarterRotation,
            'rotate-0':
              (!isExpanded && !quarterRotation) ||
              (isExpanded && quarterRotation),
          })}
        />
      </div>
    </button>
  );
}
