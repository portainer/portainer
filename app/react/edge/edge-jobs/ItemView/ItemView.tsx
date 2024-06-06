import { ListIcon, WrenchIcon } from 'lucide-react';

import { useIdParam } from '@/react/hooks/useIdParam';
import { useParamState } from '@/react/hooks/useParamState';

import { PageHeader } from '@@/PageHeader';
import { Widget } from '@@/Widget';
import { NavTabs } from '@@/NavTabs';

import { useEdgeJob } from '../queries/useEdgeJob';

import { UpdateEdgeJobForm } from './UpdateEdgeJobForm/UpdateEdgeJobForm';
import { ResultsDatatable } from './ResultsDatatable/ResultsDatatable';

const tabs = [
  {
    id: 0,
    label: 'Configuration',
    icon: WrenchIcon,
  },
  {
    id: 1,
    label: 'Results',
    icon: ListIcon,
  },
] as const;

export function ItemView() {
  const id = useIdParam();

  const [tabId = 0, setTabId] = useParamState('tab', (param) =>
    param ? parseInt(param, 10) : 0
  );

  const edgeJobQuery = useEdgeJob(id);

  if (!edgeJobQuery.data) {
    return null;
  }

  const edgeJob = edgeJobQuery.data;

  return (
    <>
      <PageHeader
        title="Edge job details"
        breadcrumbs={[{ label: 'Edge jobs', link: 'edge.jobs' }, edgeJob.Name]}
      />

      <div className="row">
        <div className="col-sm-12">
          <Widget>
            <Widget.Body>
              <NavTabs
                selectedId={tabId}
                onSelect={(id) => {
                  setTabId(id);
                }}
                options={tabs}
              />

              {tabId === tabs[0].id && <UpdateEdgeJobForm edgeJob={edgeJob} />}

              {tabId === tabs[1].id && (
                <div className="mt-4">
                  <ResultsDatatable jobId={edgeJob.Id} />
                </div>
              )}
            </Widget.Body>
          </Widget>
        </div>
      </div>
    </>
  );
}
