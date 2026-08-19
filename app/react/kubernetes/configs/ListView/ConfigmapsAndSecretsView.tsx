import { FileCode, Lock } from 'lucide-react';

import { PageHeader } from '@@/PageHeader';
import { Tab, WidgetTabs, useCurrentTabIndex } from '@@/Widget/WidgetTabs';

import { ConfigMapsDatatable } from './ConfigMapsDatatable';
import { SecretsDatatable } from './SecretsDatatable';

const tabs: Tab[] = [
  {
    name: 'ConfigMaps',
    icon: FileCode,
    widget: <ConfigMapsDatatable />,
    selectedTabParam: 'configmaps',
  },
  {
    name: 'Secrets',
    icon: Lock,
    widget: <SecretsDatatable />,
    selectedTabParam: 'secrets',
  },
];

export function ConfigmapsAndSecretsView() {
  const currentTabIndex = useCurrentTabIndex(tabs);
  return (
    <>
      <PageHeader
        title="ConfigMap & Secret lists"
        breadcrumbs="ConfigMaps & Secrets"
        reload
      />
      <>
        <WidgetTabs tabs={tabs} currentTabIndex={currentTabIndex} />
        <div className="content">{tabs[currentTabIndex].widget}</div>
      </>
    </>
  );
}
