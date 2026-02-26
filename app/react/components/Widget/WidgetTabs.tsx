import { RawParams, useCurrentStateAndParams } from '@uirouter/react';
import clsx from 'clsx';
import { ReactNode } from 'react';

import { Icon } from '@@/Icon';
import { Link } from '@@/Link';

export interface Tab {
  name: ReactNode;
  icon?: ReactNode;
  widget: ReactNode;
  selectedTabParam: string;
}

interface Props {
  currentTabIndex: number;
  tabs: Tab[];
  useContainer?: boolean;
  ariaLabel?: string;
}

export function WidgetTabs({
  currentTabIndex,
  tabs,
  useContainer = true,
  ariaLabel = 'Section navigation',
}: Props) {
  // ensure that the selectedTab param is always valid
  const invalidQueryParamValue = tabs.some(
    (tab) => encodeURIComponent(tab.selectedTabParam) !== tab.selectedTabParam
  );
  if (invalidQueryParamValue) {
    throw new Error('Invalid query param value for tab');
  }

  const tabsComponent = (
    <nav
      aria-label={ariaLabel}
      className={clsx(
        'max-w-fit overflow-hidden rounded-xl',
        'bg-[var(--bg-widget-color)] border border-solid border-[var(--border-widget)]'
      )}
    >
      {/* additional div, so that the scrollbar doesn't overlap with rounded corners of the nav parent */}
      <div className="flex items-center gap-1 p-1 overflow-x-auto">
        {tabs.map(({ name, icon }, index) => (
          <Link
            to="."
            params={{ tab: tabs[index].selectedTabParam }}
            key={index}
            className={clsx(
              'inline-flex items-center gap-2 px-4 py-2 rounded-lg',
              'hover:no-underline focus:no-underline text-gray-7 th-highcontrast:text-white th-dark:text-gray-6',
              'transition-colors duration-200',
              {
                'border-inherit !bg-graphite-50 !text-graphite-900 hover:text-graphite-900 th-dark:!bg-graphite-600 th-dark:!text-white th-highcontrast:!bg-white th-highcontrast:!text-black':
                  currentTabIndex === index,
              },
              {
                'bg-transparent hover:bg-graphite-50 th-dark:hover:bg-graphite-600 th-highcontrast:hover:bg-white hover:text-gray-7 th-dark:hover:text-gray-6 th-highcontrast:hover:text-black':
                  currentTabIndex !== index,
              }
            )}
            data-cy={`tab-${index}`}
            aria-current={currentTabIndex === index ? 'page' : undefined}
          >
            {icon && <Icon icon={icon} />}
            {name}
          </Link>
        ))}
      </div>
    </nav>
  );

  if (useContainer) {
    return (
      <div className="row">
        <div className="col-sm-12">{tabsComponent}</div>
      </div>
    );
  }

  return tabsComponent;
}

// findSelectedTabIndex returns the index of the tab, or 0 if none is selected
export function findSelectedTabIndex(params: RawParams, tabs: Tab[]) {
  const selectedTabParam = params.tab || tabs[0].selectedTabParam;
  const currentTabIndex = tabs.findIndex(
    (tab) => tab.selectedTabParam === selectedTabParam
  );
  if (currentTabIndex === -1) {
    return 0;
  }
  return currentTabIndex;
}

export function useCurrentTabIndex(tabs: Tab[]) {
  const params = useCurrentStateAndParams();
  const currentTabIndex = findSelectedTabIndex(params.params, tabs);

  return currentTabIndex;
}
