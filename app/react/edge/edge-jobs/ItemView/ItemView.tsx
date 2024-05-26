import { ListIcon, WrenchIcon } from 'lucide-react';

import { useIdParam } from '@/react/hooks/useIdParam';
import { useParamState } from '@/react/hooks/useParamState';

import { PageHeader } from '@@/PageHeader';
import { Widget } from '@@/Widget';
import { NavTabs } from '@@/NavTabs';

import { useEdgeJob } from '../queries/useEdgeJob';

// import { ResultsDatatable } from './ResultsDatatable/ResultsDatatable';
import { UpdateEdgeJobForm } from './UpdateEdgeJobForm';

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
  const [tab = 0, setTab] = useParamState<number>('tab');
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
                selectedId={tab}
                onSelect={(id) => setTab(id)}
                options={tabs}
              />

              {tab === tabs[0].id && <UpdateEdgeJobForm edgeJob={edgeJob} />}

              {/* {tab === tabs[1].id && <ResultsDatatable />} */}
            </Widget.Body>
          </Widget>
        </div>
      </div>
    </>
  );
}
