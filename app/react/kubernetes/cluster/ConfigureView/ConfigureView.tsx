import { useCurrentEnvironment } from '@/react/hooks/useCurrentEnvironment';

import { PageHeader } from '@@/PageHeader';
import { Widget, WidgetBody } from '@@/Widget';

import { ConfigureForm } from './ConfigureForm';

export function ConfigureView() {
  const { data: environment } = useCurrentEnvironment();

  // get the initial values

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
