import { useCurrentStateAndParams } from '@uirouter/react';
import { Minimize2, History, Code } from 'lucide-react';

import LaptopCode from '@/assets/ico/laptop-code.svg?c';

import { PageHeader } from '@@/PageHeader';
import { WidgetTabs, findSelectedTabIndex } from '@@/Widget/WidgetTabs';

import { useApplication } from '../application.queries';

import { ApplicationTab } from './ApplicationTab';

export function ApplicationDetailsView() {
  const stateAndParams = useCurrentStateAndParams();
  // get the params
  const {
    params: {
      namespace,
      name,
      'resource-type': resourceType,
      endpointId: environmentId,
    },
  } = stateAndParams;

  const applicationQuery = useApplication(
    environmentId,
    namespace,
    name,
    resourceType
  );

  const appDetailTabs = [
    {
      name: 'Application',
      icon: LaptopCode,
      widget: (
        <ApplicationTab
          applicationQuery={applicationQuery}
          namespace={namespace}
          name={name}
          environmentId={environmentId}
        />
      ),
      selectedTabParam: 'application',
    },
    {
      name: 'Placement',
      icon: Minimize2,
      widget: <div>Placement</div>,
      selectedTabParam: 'placement',
    },
    {
      name: 'Events',
      icon: History,
      widget: <div>Events</div>,
      selectedTabParam: 'events',
    },
    {
      name: 'YAML',
      icon: Code,
      widget: <div>YAML</div>,
      selectedTabParam: 'yaml',
    },
  ];

  const currentTabIndex = findSelectedTabIndex(stateAndParams, appDetailTabs);

  return (
    <>
      <PageHeader
        title="Application details"
        breadcrumbs={[
          { label: 'Namespaces', link: 'kubernetes.resourcePools' },
          {
            label: namespace,
            link: 'kubernetes.resourcePools.resourcePool',
            linkParams: { id: namespace, 'resource-type': resourceType },
          },
          { label: 'Applications', link: 'kubernetes.applications' },
          { label: name },
        ]}
        reload
      />
      <WidgetTabs currentTabIndex={currentTabIndex} tabs={appDetailTabs} />
      <div className="row">
        <div className="col-sm-12">
          <div className="content">{appDetailTabs[currentTabIndex].widget}</div>
        </div>
      </div>
    </>
  );
}
