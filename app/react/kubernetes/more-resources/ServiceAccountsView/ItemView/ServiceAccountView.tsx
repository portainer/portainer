import { useCurrentStateAndParams } from '@uirouter/react';
import { Code, User } from 'lucide-react';

import { PageHeader } from '@@/PageHeader';
import { WidgetTabs, useCurrentTabIndex, Tab } from '@@/Widget/WidgetTabs';

import { ServiceAccountDetailsWidget } from './ServiceAccountDetailsWidget';
import { ServiceAccountYAMLEditor } from './ServiceAccountYAMLEditor';

export function ServiceAccountView() {
  const {
    params: { namespace, name },
  } = useCurrentStateAndParams();

  const tabs: Tab[] = [
    {
      name: 'Service account',
      icon: User,
      widget: <ServiceAccountDetailsWidget namespace={namespace} name={name} />,
      selectedTabParam: 'service-account',
    },
    {
      name: 'YAML',
      icon: Code,
      widget: <ServiceAccountYAMLEditor />,
      selectedTabParam: 'YAML',
    },
  ];

  const currentTabIndex = useCurrentTabIndex(tabs);

  return (
    <>
      <PageHeader
        title="Service account details"
        breadcrumbs={[
          {
            label: 'Service accounts',
            link: 'kubernetes.moreResources.serviceAccounts',
          },
          {
            label: namespace,
            link: 'kubernetes.resourcePools.resourcePool',
            linkParams: { id: namespace },
          },
          name,
        ]}
        reload
      />
      <WidgetTabs tabs={tabs} currentTabIndex={currentTabIndex} />
      {tabs[currentTabIndex].widget}
    </>
  );
}
