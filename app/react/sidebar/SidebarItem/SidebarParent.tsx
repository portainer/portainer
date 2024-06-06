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
          'w-full h-8 items-center ease-in-out transition-colors flex duration-200 hover:bg-blue-5/20 be:hover:bg-gray-5/20 th-dark:hover:bg-gray-true-5/20 rounded-md',
          isSidebarOpen && 'pl-3',
          // only highlight the parent when the sidebar is closed/contracted and a child item is selected
          (!isSidebarOpen || !isExpanded) && anchorProps.className
        )}
        data-cy={dataCy}
      >
        <button
          type="button"
          className="flex-1 h-full cursor-pointer flex items-center border-none bg-transparent"
          onClick={() => setIsExpanded(true)}
        >
          <Link
            to={to}
            params={params}
            className={clsx(
              'w-full h-full items-center flex list-none border-none text-inherit hover:text-inherit hover:no-underline focus:text-inherit focus:no-underline',
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
      className={clsx('text-white !pl-11', {
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
          <li className="flex items-center space-x-2 text-sm mb-1">
            <span>{title}</span>
          </li>
          <div className="bg-blue-8 be:bg-gray-8 th-dark:bg-gray-true-8 th-highcontrast:bg-black th-highcontrast:border th-highcontrast:border-solid th-highcontrast:border-white rounded">
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
      className="flex-none border-none bg-transparent flex items-center group p-0 px-3 h-8"
    />
  );
}
