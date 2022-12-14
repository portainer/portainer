import {
  TransitionOptions,
  useCurrentStateAndParams,
  useSrefActive as useUiRouterSrefActive,
} from '@uirouter/react';
import clsx from 'clsx';
import { ComponentProps } from 'react';
import Tippy from '@tippyjs/react';

import { AutomationTestingProps } from '@/types';

import 'tippy.js/dist/tippy.css';
import { Link } from '@@/Link';
import { IconProps, Icon } from '@@/Icon';

import { useSidebarState } from '../useSidebarState';

interface Props
  extends IconProps,
    ComponentProps<typeof Link>,
    AutomationTestingProps {
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
  'data-cy': dataCy,
}: Props) {
  const { isOpen } = useSidebarState();
  const anchorProps = useSrefActive(
    to,
    'bg-blue-8 be:bg-gray-8 th-dark:bg-gray-true-8',
    params,
    options,
    ignorePaths
  );

  const anchor = (
    <a
      href={anchorProps.href}
      onClick={anchorProps.onClick}
      className={clsx(
        anchorProps.className,
        'text-inherit no-underline hover:no-underline hover:text-inherit focus:no-underline focus:text-inherit',
        'w-full flex-1 rounded-md flex items-center h-8 space-x-4 text-sm',
        'hover:bg-blue-9 th-dark:hover:bg-gray-true-9 be:hover:bg-gray-9 transition-colors duration-200',
        {
          'px-3 justify-start w-full': isOpen,
          'justify-center w-8': !isOpen,
        }
      )}
      data-cy={dataCy}
    >
      {!!icon && <Icon icon={icon} className={clsx('flex [&>svg]:w-4')} />}
      {isOpen && <span>{label}</span>}
    </a>
  );

  if (isOpen) return anchor;

  return (
    <Tippy
      className="!opacity-100 bg-blue-9 be:bg-gray-9 th-dark:bg-gray-true-9 !rounded-md !py-2 !px-3"
      content={label}
      delay={[0, 0]}
      duration={[0, 0]}
      zIndex={1000}
      placement="right"
      arrow
      allowHTML
      interactive
    >
      {anchor}
    </Tippy>
  );
}

function useSrefActive(
  to: string,
  activeClassName: string,
  params: Partial<Record<string, string>> = {},
  options: TransitionOptions = {},
  ignorePaths: string[] = []
) {
  const { state: { name: stateName = '' } = {} } = useCurrentStateAndParams();
  const anchorProps = useUiRouterSrefActive(
    to,
    params || {},
    activeClassName,
    options
  );

  const className = ignorePaths.some((path) => stateName.includes(path))
    ? ''
    : anchorProps.className;

  return {
    ...anchorProps,
    className,
  };
}
