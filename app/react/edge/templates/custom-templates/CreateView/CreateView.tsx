import { PageHeader } from '@@/PageHeader';
import { Widget } from '@@/Widget';

import { CreateTemplateForm } from './CreateTemplateForm';

export function CreateView() {
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
              <CreateTemplateForm />
            </Widget.Body>
          </Widget>
        </div>
      </div>
    </div>
  );
}
