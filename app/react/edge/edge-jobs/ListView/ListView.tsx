import { InformationPanel } from '@@/InformationPanel';
import { PageHeader } from '@@/PageHeader';

import { EdgeJobsDatatable } from './EdgeJobsDatatable';

export function ListView() {
  return (
    <>
      <PageHeader title="Edge Jobs" breadcrumbs="Edge Jobs" reload />

      <div className="row">
        <div className="col-sm-12">
          <InformationPanel title="Information">
            <p className="small text-muted">
              Edge Jobs requires Docker Standalone and a cron implementation
              that reads jobs from <code>/etc/cron.d</code>
            </p>
          </InformationPanel>
        </div>
      </div>

      <EdgeJobsDatatable />
    </>
  );
}
