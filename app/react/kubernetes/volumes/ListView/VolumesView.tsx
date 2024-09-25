import { useCurrentStateAndParams } from '@uirouter/react';
import { Database, HardDrive } from 'lucide-react';

import { PageHeader } from '@@/PageHeader';
import { WidgetTabs, Tab, findSelectedTabIndex } from '@@/Widget/WidgetTabs';

import { VolumesDatatable } from './VolumesDatatable';
import { StorageDatatable } from './StorageDatatable';

export function VolumesView() {
  const tabs: Tab[] = [
    {
      name: 'Volumes',
      icon: Database,
      widget: <VolumesDatatable />,
      selectedTabParam: 'volumes',
    },
    {
      name: 'Storage',
      icon: HardDrive,
      widget: <StorageDatatable />,
      selectedTabParam: 'storage',
    },
  ];

  const currentTabIndex = findSelectedTabIndex(
    useCurrentStateAndParams(),
    tabs
  );

  return (
    <>
      <PageHeader title="Volume list" breadcrumbs="Volumes" reload />
      <>
        <WidgetTabs tabs={tabs} currentTabIndex={currentTabIndex} />
        <div className="content">{tabs[currentTabIndex].widget}</div>
      </>
    </>
  );
}
