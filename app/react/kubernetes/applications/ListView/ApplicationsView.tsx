import { BoxIcon, List } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { usePublicSettings } from '@/react/portainer/settings/queries/usePublicSettings';

import { PageHeader } from '@@/PageHeader';
import { Tab, WidgetTabs, useCurrentTabIndex } from '@@/Widget/WidgetTabs';

import { ApplicationsDatatable } from './ApplicationsDatatable';
import { ApplicationsStacksDatatable } from './ApplicationsStacksDatatable';
import { useKubeAppsTableStore } from './useKubeAppsTableStore';

export function ApplicationsView() {
  const { t } = useTranslation();
  const tableState = useKubeAppsTableStore('kubernetes.applications', 'Name');
  const hideStacksQuery = usePublicSettings({
    select: (settings) =>
      settings.GlobalDeploymentOptions.hideStacksFunctionality,
  });
  const hideStacks = hideStacksQuery.isLoading || !!hideStacksQuery.data;

  const tabs: Tab[] = [
    {
      name: 'Applications',
      icon: BoxIcon,
      widget: <ApplicationsDatatable tableState={tableState} />,
      selectedTabParam: 'applications',
    },
    {
      name: 'Stacks',
      icon: List,
      widget: <ApplicationsStacksDatatable tableState={tableState} />,
      selectedTabParam: 'stacks',
    },
  ];

  const currentTabIndex = useCurrentTabIndex(tabs);

  return (
    <>
      <PageHeader title={t('kubernetes.applications.title')} breadcrumbs={t('kubernetes.applications.breadcrumbs')} reload />
      {hideStacks ? (
        <ApplicationsDatatable tableState={tableState} hideStacks />
      ) : (
        <>
          <WidgetTabs tabs={tabs} currentTabIndex={currentTabIndex} />
          <div className="content">{tabs[currentTabIndex].widget}</div>
        </>
      )}
    </>
  );
}
