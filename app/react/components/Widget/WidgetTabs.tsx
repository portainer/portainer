import { RawParams, useCurrentStateAndParams } from '@uirouter/react';
import { ReactNode } from 'react';

import { Icon } from '@@/Icon';
import { Link } from '@@/Link';
import { Tabs } from '@@/primitives/Tabs/Tabs';

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
  const invalidQueryParamValue = tabs.some(
    (tab) => encodeURIComponent(tab.selectedTabParam) !== tab.selectedTabParam
  );
  if (invalidQueryParamValue) {
    throw new Error('Invalid query param value for tab');
  }

  const tabsComponent = (
    <Tabs.Container as="nav" aria-label={ariaLabel}>
      {tabs.map(({ name, icon }, index) => (
        <Tabs.Item key={index} asChild isActive={currentTabIndex === index}>
          <Link
            to="."
            params={{ tab: tabs[index].selectedTabParam }}
            data-cy={`tab-${index}`}
            aria-current={currentTabIndex === index ? 'page' : undefined}
          >
            {icon && <Icon icon={icon} />}
            {name}
          </Link>
        </Tabs.Item>
      ))}
    </Tabs.Container>
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
