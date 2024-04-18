import { AlertTriangle, Code, History, Minimize2 } from 'lucide-react';
import { useCurrentStateAndParams } from '@uirouter/react';

import LaptopCode from '@/assets/ico/laptop-code.svg?c';

import { PageHeader } from '@@/PageHeader';
import { Tab, WidgetTabs, findSelectedTabIndex } from '@@/Widget/WidgetTabs';
import { Icon } from '@@/Icon';
import { Badge } from '@@/Badge';

import { EventsDatatable } from '../../components/EventsDatatable';

import {
  PlacementsDatatable,
  usePlacementTableData,
  usePlacementTableState,
} from './PlacementsDatatable';
import { ApplicationDetailsWidget } from './ApplicationDetailsWidget';
import { ApplicationSummaryWidget } from './ApplicationSummaryWidget';
import { ApplicationContainersDatatable } from './ApplicationContainersDatatable';
import {
  useApplicationEventsTableData,
  useApplicationEventsTableState,
} from './useApplicationEventsTableData';
import { ApplicationYAMLEditor } from './AppYAMLEditor/ApplicationYAMLEditor';
import { useApplicationYAML } from './AppYAMLEditor/useApplicationYAML';

export function ApplicationDetailsView() {
  const stateAndParams = useCurrentStateAndParams();
  const {
    params: { namespace, name },
  } = stateAndParams;

  // placements table data
  const { placementsData, isPlacementsTableLoading, hasPlacementWarning } =
    usePlacementTableData();
  const placementsTableState = usePlacementTableState();

  // events table data
  const { appEventsData, appEventWarningCount, isAppEventsTableLoading } =
    useApplicationEventsTableData();
  const appEventsTableState = useApplicationEventsTableState();

  // load app yaml data early to load from cache later
  useApplicationYAML();

  const tabs: Tab[] = [
    {
      name: 'Application',
      icon: LaptopCode,
      widget: <ApplicationSummaryWidget />,
      selectedTabParam: 'application',
    },
    {
      name: (
        <div className="flex items-center gap-x-2">
          Placement
          {hasPlacementWarning && (
            <Badge type="warnSecondary">
              <Icon icon={AlertTriangle} className="!mr-1" />1
            </Badge>
          )}
        </div>
      ),
      icon: Minimize2,
      widget: (
        <PlacementsDatatable
          hasPlacementWarning={hasPlacementWarning}
          tableState={placementsTableState}
          dataset={placementsData}
          isLoading={isPlacementsTableLoading}
        />
      ),
      selectedTabParam: 'placement',
    },
    {
      name: (
        <div className="flex items-center gap-x-2">
          Events
          {appEventWarningCount >= 1 && (
            <Badge type="warnSecondary">
              <Icon icon={AlertTriangle} className="!mr-1" />
              {appEventWarningCount}
            </Badge>
          )}
        </div>
      ),
      icon: History,
      widget: (
        <EventsDatatable
          dataset={appEventsData}
          tableState={appEventsTableState}
          isLoading={isAppEventsTableLoading}
          data-cy="k8sAppDetail-eventsTable"
        />
      ),
      selectedTabParam: 'events',
    },
    {
      name: 'YAML',
      icon: Code,
      widget: <ApplicationYAMLEditor />,
      selectedTabParam: 'YAML',
    },
  ];
  const currentTabIndex = findSelectedTabIndex(stateAndParams, tabs);

  return (
    <>
      <PageHeader
        title="Application details"
        breadcrumbs={[
          { label: 'Namespaces', link: 'kubernetes.resourcePools' },
          {
            label: namespace,
            link: 'kubernetes.resourcePools.resourcePool',
            linkParams: { id: namespace },
          },
          { label: 'Applications', link: 'kubernetes.applications' },
          name,
        ]}
        reload
      />
      <>
        <WidgetTabs tabs={tabs} currentTabIndex={currentTabIndex} />
        {tabs[currentTabIndex].widget}
        <ApplicationDetailsWidget />
        <ApplicationContainersDatatable />
      </>
    </>
  );
}
