import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';
import { useIsSwarm } from '@/react/docker/proxy/queries/useInfo';
import { StackType } from '@/react/common/stacks/types';
import { ContainerEngine } from '@/react/portainer/environments/types';

import { PageHeader } from '@@/PageHeader';
import { Widget } from '@@/Widget';

import { TemplateViewType, useViewType } from '../useViewType';

import { CreateForm } from './CreateForm';

export function CreateView() {
  const viewType = useViewType();
  const environmentId = useEnvironmentId(false);
  const isSwarm = useIsSwarm(environmentId, {
    enabled: viewType === ContainerEngine.Docker,
  });
  const defaultType = getDefaultType(viewType, isSwarm);

  return (
    <div>
      <PageHeader
        title="Create Custom Template"
        breadcrumbs={[
          { label: 'Custom Templates', link: '^' },
          'Create Custom Template',
        ]}
      />

      <div className="row">
        <div className="col-sm-12">
          <Widget>
            <Widget.Body>
              <CreateForm
                viewType={viewType}
                environmentId={environmentId}
                defaultType={defaultType}
              />
            </Widget.Body>
          </Widget>
        </div>
      </div>
    </div>
  );
}

function getDefaultType(
  viewType: TemplateViewType,
  isSwarm: boolean
): StackType {
  switch (viewType) {
    case 'docker':
      return isSwarm ? StackType.DockerSwarm : StackType.DockerCompose;
    case 'kube':
      return StackType.Kubernetes;
    default:
      return StackType.DockerCompose;
  }
}
