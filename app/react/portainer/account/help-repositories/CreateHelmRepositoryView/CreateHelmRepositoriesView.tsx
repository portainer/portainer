import { PageHeader } from '@@/PageHeader';
import { Widget, WidgetBody } from '@@/Widget';

import { CreateHelmRepositoryForm } from './CreateHelmRespositoriesForm';

export function CreateHelmRepositoriesView() {
  return (
    <>
      <PageHeader
        title="Create helm repository"
        breadcrumbs={[
          { label: 'My account', link: 'portainer.account' },
          { label: 'Create helm repository' },
        ]}
      />

      <div className="row">
        <div className="col-sm-12">
          <Widget>
            <WidgetBody>
              <CreateHelmRepositoryForm routeOnSuccess="portainer.account" />
            </WidgetBody>
          </Widget>
        </div>
      </div>
    </>
  );
}
