import { useCurrentStateAndParams } from '@uirouter/react';

import { StackType } from '@/react/common/stacks/types';
import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';

import { PageHeader } from '@@/PageHeader';
import { Widget } from '@@/Widget';

import { CreateForm } from './CreateForm';

export function CreateView() {
  const defaultType = useDefaultType();
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
              <CreateForm
                defaultType={defaultType}
                environmentId={environmentId}
              />
            </Widget.Body>
          </Widget>
        </div>
      </div>
    </div>
  );
}

function useDefaultType() {
  const {
    state: { name },
  } = useCurrentStateAndParams();
  if (name?.includes('kubernetes')) {
    return StackType.Kubernetes;
  }

  // edge or docker
  return StackType.DockerCompose;
}
