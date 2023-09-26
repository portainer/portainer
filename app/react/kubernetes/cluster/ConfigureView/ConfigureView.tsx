import { useCurrentEnvironment } from '@/react/hooks/useCurrentEnvironment';
import { useUnauthorizedRedirect } from '@/react/hooks/useUnauthorizedRedirect';
import { isBE } from '@/react/portainer/feature-flags/feature-flags.service';

import { PageHeader } from '@@/PageHeader';
import { Widget, WidgetBody } from '@@/Widget';

import { ConfigureForm } from './ConfigureForm';

export function ConfigureView() {
  const { data: environment } = useCurrentEnvironment();

  useUnauthorizedRedirect(
    'K8sClusterW',
    'kubernetes.dashboard',
    {
      id: environment?.Id,
    },
    environment?.Id,
    !isBE
  );

  return (
    <>
      <PageHeader
        title="Kubernetes features configuration"
        reload
        breadcrumbs={[
          { label: 'Environments', link: 'portainer.endpoints' },
          {
            label: environment?.Name || '',
            link: 'portainer.endpoints.endpoint',
            linkParams: { id: environment?.Id },
          },
          'Kubernetes configuration',
        ]}
      />
      <div className="row">
        <div className="col-sm-12">
          <Widget>
            <WidgetBody>
              <ConfigureForm />
            </WidgetBody>
          </Widget>
        </div>
      </div>
    </>
  );
}
