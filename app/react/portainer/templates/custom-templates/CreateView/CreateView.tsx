import { useCurrentStateAndParams } from '@uirouter/react';

import { StackType } from '@/react/common/stacks/types';

import { PageHeader } from '@@/PageHeader';
import { Widget } from '@@/Widget';

import { CreateForm } from './CreateForm';

export function CreateView() {
  const form = useTemplatePlatformType();
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
            <Widget.Body>{form}</Widget.Body>
          </Widget>
        </div>
      </div>
    </div>
  );
}

function useTemplatePlatformType() {
  const {
    params: { endpointId },
    state: { name },
  } = useCurrentStateAndParams();
  if (name?.includes('kubernetes')) {
    return (
      <CreateForm
        defaultType={StackType.Kubernetes}
        environmentId={endpointId}
      />
    );
  }

  if (name?.includes('edge')) {
    return <CreateForm defaultType={StackType.DockerCompose} />;
  }

  return (
    <CreateForm
      defaultType={StackType.DockerCompose}
      environmentId={endpointId}
    />
  );
}
