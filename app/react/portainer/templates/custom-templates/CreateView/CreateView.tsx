import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';

import { PageHeader } from '@@/PageHeader';
import { Widget } from '@@/Widget';

import { useViewType } from '../useViewType';

import { CreateForm } from './CreateForm';

export function CreateView() {
  const viewType = useViewType();
  const environmentId = useEnvironmentId(false);

  return (
    <div>
      <PageHeader
        title="Create Custom template"
        breadcrumbs={[
          { label: 'Custom Templates', link: '^' },
          'Create Custom template',
        ]}
      />

      <div className="row">
        <div className="col-sm-12">
          <Widget>
            <Widget.Body>
              <CreateForm viewType={viewType} environmentId={environmentId} />
            </Widget.Body>
          </Widget>
        </div>
      </div>
    </div>
  );
}
