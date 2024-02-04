import { useCurrentEnvironment } from '@/react/hooks/useCurrentEnvironment';
import { useUnauthorizedRedirect } from '@/react/hooks/useUnauthorizedRedirect';

import { PageHeader } from '@@/PageHeader';
import { Widget, WidgetBody } from '@@/Widget';

import { ConfigureForm } from './ConfigureForm';

export function ConfigureView() {
  const { data: environment } = useCurrentEnvironment();

  useUnauthorizedRedirect(
    {
      authorizations: 'K8sClusterW',
      adminOnlyCE: false,
    },
    {
      params: {
        id: environment?.Id,
      },
      to: 'kubernetes.dashboard',
    }
  );

  return (
    <>
      <PageHeader
        title="Kubernetes features configuration"
        breadcrumbs={[
          { label: 'Environments', link: 'portainer.endpoints' },
          {
            label: environment?.Name || '',
            link: 'portainer.endpoints.endpoint',
            linkParams: { id: environment?.Id },
          },
          'Kubernetes configuration',
        ]}
        reload
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
