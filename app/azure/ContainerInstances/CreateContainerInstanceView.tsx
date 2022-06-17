import { r2a } from '@/react-tools/react2angular';

import { PageHeader } from '@@/PageHeader';
import { Widget, WidgetBody } from '@@/Widget';

import { CreateContainerInstanceForm } from './CreateContainerInstanceForm';

export function CreateContainerInstanceView() {
  return (
    <>
      <PageHeader
        title="Create container instance"
        breadcrumbs={[
          { link: 'azure.containerinstances', label: 'Container instances' },
          { label: 'Add container' },
        ]}
      />

      <div className="row">
        <div className="col-sm-12">
          <Widget>
            <WidgetBody>
              <CreateContainerInstanceForm />
            </WidgetBody>
          </Widget>
        </div>
      </div>
    </>
  );
}

export const CreateContainerInstanceViewAngular = r2a(
  CreateContainerInstanceView,
  []
);
