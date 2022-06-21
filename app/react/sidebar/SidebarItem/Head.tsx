import {
  TransitionOptions,
  useCurrentStateAndParams,
  useSrefActive as useUiRouterSrefActive,
} from '@uirouter/react';
import clsx from 'clsx';
import { ComponentProps } from 'react';

import { Link } from '@@/Link';
import { IconProps, Icon } from '@@/Icon';

import { useSidebarState } from '../useSidebarState';

interface Props extends IconProps, ComponentProps<typeof Link> {
  label: string;
  ignorePaths?: string[];
}

export function Head({
  to,
  options,
  params = {},
  label,
  icon,
  ignorePaths = [],
}: Props) {
  const { isOpen } = useSidebarState();
  const anchorProps = useSrefActive(
    to,
    'bg-blue-1 be:bg-grey-7',
    params,
    options,
    ignorePaths
  );

  return (
    <a
      href={anchorProps.href}
      onClick={anchorProps.onClick}
      title={label}
      className={clsx(
        anchorProps.className,
        'text-white no-underline hover:no-underline hover:text-white focus:no-underline focus:text-white w-full flex-1 rounded-md',
        { 'px-3': isOpen }
      )}
    >
      <div
        className={clsx('flex items-center h-8 space-x-4 text-sm', {
          'justify-start w-full': isOpen,
          'justify-center w-8': !isOpen,
        })}
      >
        {!!icon && (
          <Icon icon={icon} feather className={clsx('flex [&>svg]:w-4')} />
        )}
        {isOpen && <span>{label}</span>}
      </div>
    </a>
  );
}

function useSrefActive(
  to: string,
  activeClassName: string,
  params: Partial<Record<string, string>> = {},
  options: TransitionOptions = {},
  ignorePaths: string[] = []
) {
  const { state } = useCurrentStateAndParams();
  const anchorProps = useUiRouterSrefActive(
    to,
    params || {},
    'bg-blue-1 be:bg-grey-7',
    options
  );

  const className = ignorePaths.includes(state.name || '')
    ? ''
    : anchorProps.className;

  return {
    ...anchorProps,
    className,
  };
}
