import { PageHeader } from '@@/PageHeader';

import { CreateNamespaceForm } from './CreateNamespaceForm';

export function CreateNamespaceView() {
  return (
    <div className="form-horizontal">
      <PageHeader
        title="Create a namespace"
        breadcrumbs="Create a namespace"
        reload
      />

      <div className="row">
        <div className="col-sm-12">
          <CreateNamespaceForm />
        </div>
      </div>
    </div>
  );
}
