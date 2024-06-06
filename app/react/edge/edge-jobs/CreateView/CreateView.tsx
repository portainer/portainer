import { PageHeader } from '@@/PageHeader';
import { Widget } from '@@/Widget';

import { CreateEdgeJobForm } from './CreateEdgeJobForm';

export function CreateView() {
  return (
    <>
      <PageHeader
        title="Create edge job"
        breadcrumbs={[
          { label: 'Edge jobs', link: 'edge.jobs' },
          'Create edge job',
        ]}
      />

      <div className="row">
        <div className="col-sm-12">
          <Widget>
            <Widget.Body>
              <CreateEdgeJobForm />
            </Widget.Body>
          </Widget>
        </div>
      </div>
    </>
  );
}
