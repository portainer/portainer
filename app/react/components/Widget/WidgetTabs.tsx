import { RawParams } from '@uirouter/react';
import clsx from 'clsx';
import { ReactNode } from 'react';

import { Icon } from '@@/Icon';
import { Link } from '@@/Link';

export interface Tab {
  name: ReactNode;
  icon: ReactNode;
  widget: ReactNode;
  selectedTabParam: string; // this string should be a valid query param value
}

interface Props {
  currentTabIndex: number;
  tabs: Tab[];
}

export function WidgetTabs({ currentTabIndex, tabs }: Props) {
  // ensure that all selectedTab params are valid
  const invalidQueryParamValues = tabs.filter(
    (tab) => encodeURIComponent(tab.selectedTabParam) !== tab.selectedTabParam
  );
  if (invalidQueryParamValues.length) {
    throw new Error(
      `Invalid query param value for tab(s): ${invalidQueryParamValues
        .map((tab) => tab.name)
        .join(', ')}`
    );
  }

  return (
    <div className="row">
      <div className="col-sm-12 !mb-0">
        <div className="pl-2">
          {tabs.map(({ name, icon }, index) => (
            <Link
              to="."
              params={{ 'selected-tab': tabs[index].selectedTabParam }}
              key={index}
              className={clsx(
                'inline-flex items-center gap-2 border-0 border-b-2 border-solid bg-transparent px-4 py-2',
                currentTabIndex === index
                  ? 'border-blue-8  text-blue-8 th-highcontrast:border-blue-6 th-highcontrast:text-blue-6 th-dark:border-blue-6 th-dark:text-blue-6'
                  : 'border-transparent'
              )}
            >
              <Icon icon={icon} />
              {name}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

// findSelectedTabIndex returns the index of the selected-tab, or 0 if none is selected
export function findSelectedTabIndex(
  { params }: { params: RawParams },
  tabs: Tab[]
) {
  const selectedTabParam = params['selected-tab'] || tabs[0].selectedTabParam;
  const currentTabIndex = tabs.findIndex(
    (tab) => tab.selectedTabParam === selectedTabParam
  );
  return currentTabIndex === -1 ? 0 : currentTabIndex;
}
