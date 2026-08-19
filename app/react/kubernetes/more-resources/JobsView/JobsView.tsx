import { CalendarCheck2, CalendarSync } from 'lucide-react';

import { useUnauthorizedRedirect } from '@/react/hooks/useUnauthorizedRedirect';

import { PageHeader } from '@@/PageHeader';
import { WidgetTabs, Tab, useCurrentTabIndex } from '@@/Widget/WidgetTabs';

import { JobsDatatable } from './JobsDatatable/JobsDatatable';
import { CronJobsDatatable } from './CronJobsDatatable/CronJobsDatatable';

export function JobsView() {
  useUnauthorizedRedirect(
    { authorizations: ['K8sJobsR', 'K8sCronJobsR'] },
    { to: 'kubernetes.dashboard' }
  );

  const tabs: Tab[] = [
    {
      name: 'Cron Jobs',
      icon: CalendarSync,
      widget: <CronJobsDatatable />,
      selectedTabParam: 'cronJobs',
    },
    {
      name: 'Jobs',
      icon: CalendarCheck2,
      widget: <JobsDatatable />,
      selectedTabParam: 'jobs',
    },
  ];

  const currentTabIndex = useCurrentTabIndex(tabs);

  return (
    <>
      <PageHeader
        title="Cron Job & Job lists"
        breadcrumbs="Cron Jobs & Jobs"
        reload
      />
      <>
        <WidgetTabs tabs={tabs} currentTabIndex={currentTabIndex} />
        <div className="content">{tabs[currentTabIndex].widget}</div>
      </>
    </>
  );
}
