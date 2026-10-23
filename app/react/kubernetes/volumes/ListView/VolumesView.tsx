import { Database, HardDrive } from 'lucide-react';

import { PageHeader } from '@@/PageHeader';
import { WidgetTabs, Tab, useCurrentTabIndex } from '@@/Widget/WidgetTabs';

import { PersistentVolumesDatatable } from './PersistentVolumesDatatable';
import { StorageClassesDatatable } from './StorageClassesDatatable';
import { PersistentVolumeClaimsDatatable } from './PersistentVolumeClaimsDatatable';

export function VolumesView() {
  const tabs: Tab[] = [
    {
      name: 'Persistent volume claims',
      icon: Database,
      widget: <PersistentVolumeClaimsDatatable />,
      selectedTabParam: 'volume-claims',
    },
    {
      name: 'Persistent volumes',
      icon: Database,
      widget: <PersistentVolumesDatatable />,
      selectedTabParam: 'volumes',
    },
    {
      name: 'Storage classes',
      icon: HardDrive,
      widget: <StorageClassesDatatable />,
      selectedTabParam: 'storage',
    },
  ];

  const currentTabIndex = useCurrentTabIndex(tabs);

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
