import clsx from 'clsx';
import { PropsWithChildren, useState } from 'react';

import { AutomationTestingProps } from '@/types';

import { Icon } from '@@/Icon';
import { Link } from '@@/Link';
import { CollapseExpandButton } from '@@/CollapseExpandButton';

import { useSidebarState } from '../useSidebarState';

import { Wrapper } from './Wrapper';
import { PathOptions, useSidebarSrefActive } from './useSidebarSrefActive';
import { SidebarTooltip } from './SidebarTooltip';

type Props = {
  label: string;
  icon: React.ReactNode;
  to: string;
  pathOptions?: PathOptions;
  params?: object;
  listId: string;
};

export function SidebarParent({
  children,
  icon,
  label: title,
  to,
  params,
  pathOptions,
  listId,
  'data-cy': dataCy,
}: PropsWithChildren<Props & AutomationTestingProps>) {
  const anchorProps = useSidebarSrefActive(
    to,
    undefined,
    params,
    {},
    pathOptions
  );

  const hasActiveChild = !!anchorProps.className;

  const { isOpen: isSidebarOpen } = useSidebarState();

  const [isExpanded, setIsExpanded] = useState(hasActiveChild);

  const parentItem = (
    <Wrapper className="flex flex-col">
      <div
        className={clsx(
          'flex h-8 w-full items-center rounded-md transition-colors duration-200 ease-in-out hover:bg-graphite-500',
          // only highlight the parent when the sidebar is closed/contracted and a child item is selected
          (!isSidebarOpen || !isExpanded) && anchorProps.className
        )}
        data-cy={dataCy}
      >
        <button
          type="button"
          className={clsx(
            'flex h-full flex-1 cursor-pointer items-center border-none bg-transparent p-0',
            isSidebarOpen && 'pl-3'
          )}
          onClick={() => setIsExpanded(true)}
        >
          <Link
            to={to}
            params={params}
            className={clsx(
              'flex h-full w-full list-none items-center border-none !text-inherit hover:!text-inherit hover:no-underline focus:!text-inherit focus:!no-underline',
              {
                'justify-start': isSidebarOpen,
                'justify-center': !isSidebarOpen,
              }
            )}
            data-cy={`${dataCy}-link`}
          >
            <Icon icon={icon} />
            {isSidebarOpen && <span className="pl-4">{title}</span>}
          </Link>
        </button>
        {isSidebarOpen && (
          <SidebarExpandButton
            onClick={() => setIsExpanded((isExpanded) => !isExpanded)}
            isExpanded={isExpanded}
            listId={listId}
          />
        )}
      </div>
    </Wrapper>
  );

  const childList = (
    <ul
      id={listId}
      // pl-11 must be important because it needs to avoid the padding from '.root ul' in sidebar.module.css
      className={clsx('!pl-11 text-white', {
        hidden: !isExpanded,
        block: isExpanded,
      })}
    >
      {children}
    </ul>
  );

  if (isSidebarOpen)
    return (
      <>
        {parentItem}
        {childList}
      </>
    );

  return (
    <SidebarTooltip
      content={
        <ul>
          <li className="mb-1 flex items-center space-x-2 text-sm">
            <span>{title}</span>
          </li>
          <div className="rounded th-highcontrast:border th-highcontrast:border-solid th-highcontrast:border-white th-highcontrast:bg-black">
            {children}
          </div>
        </ul>
      }
    >
      <span>{parentItem}</span>
    </SidebarTooltip>
  );
}

function SidebarExpandButton({
  isExpanded,
  listId,
  onClick,
}: {
  onClick(): void;
  isExpanded: boolean;
  listId: string;
}) {
  return (
    <CollapseExpandButton
      isExpanded={isExpanded}
      onClick={onClick}
      aria-controls={listId}
      data-cy="expand-button"
      className="group flex h-8 flex-none items-center border-none bg-transparent p-0 px-3"
    />
  );
}
