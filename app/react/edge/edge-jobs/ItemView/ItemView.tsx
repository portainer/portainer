import { ListIcon, WrenchIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { useIdParam } from '@/react/hooks/useIdParam';

import { PageHeader } from '@@/PageHeader';
import { Widget } from '@@/Widget';
import { Tab, useCurrentTabIndex, WidgetTabs } from '@@/Widget/WidgetTabs';

import { useEdgeJob } from '../queries/useEdgeJob';

import { UpdateEdgeJobForm } from './UpdateEdgeJobForm/UpdateEdgeJobForm';
import { ResultsDatatable } from './ResultsDatatable/ResultsDatatable';

const TABS_FOR_INDEX: Tab[] = [
  {
    name: 'Configuration',
    icon: WrenchIcon,
    widget: null,
    selectedTabParam: 'configuration',
  },
  {
    name: 'Results',
    icon: ListIcon,
    widget: null,
    selectedTabParam: 'results',
  },
];


export function ItemView() {
  const { t } = useTranslation();
  const id = useIdParam();
  const edgeJobQuery = useEdgeJob(id);
  const currentTabIndex = useCurrentTabIndex(TABS_FOR_INDEX);

  if (!edgeJobQuery.data) {
    return null;
  }

  const edgeJob = edgeJobQuery.data;

  const tabs: Tab[] = [
    {
      name: t('edge.jobs_tab_config'),
      icon: WrenchIcon,
      widget: (
        <div className="row">
          <div className="col-sm-12">
            <Widget>
              <Widget.Body>
                <UpdateEdgeJobForm edgeJob={edgeJob} />
              </Widget.Body>
            </Widget>
          </div>
        </div>
      ),
      selectedTabParam: 'configuration',
    },
    {
      name: t('edge.jobs_tab_results'),
      icon: ListIcon,
      widget: <ResultsDatatable jobId={edgeJob.Id} />,
      selectedTabParam: 'results',
    },
  ];

  return (
    <>
      <PageHeader
        title={t('edge.jobs_details')}
        breadcrumbs={[{ label: t('edge.jobs_title'), link: 'edge.jobs' }, edgeJob.Name]}
      />

      {tabs.length === 1 ? (
        <div className="row">
          <div className="col-sm-12">{tabs[0].widget}</div>
        </div>
      ) : (
        <>
          <WidgetTabs tabs={tabs} currentTabIndex={currentTabIndex} />
          {tabs[currentTabIndex].widget}
        </>
      )}
    </>
  );
}
