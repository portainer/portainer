import { Pencil } from 'lucide-react';
import { useCurrentStateAndParams } from '@uirouter/react';
import { Pod } from 'kubernetes-types/core/v1';

import { Authorized } from '@/react/hooks/useUser';
import { useStackFile } from '@/react/common/stacks/stack.service';
import { useNamespaceQuery } from '@/react/kubernetes/namespaces/queries/useNamespaceQuery';

import { Widget, WidgetBody } from '@@/Widget';
import { AddButton, Button } from '@@/buttons';
import { Link } from '@@/Link';
import { Icon } from '@@/Icon';

import { applicationIsKind, isExternalApplication } from '../../utils';
import { appStackIdLabel } from '../../constants';
import { useApplication } from '../../queries/useApplication';
import { useApplicationServices } from '../../queries/useApplicationServices';

import { RestartApplicationButton } from './RestartApplicationButton';
import { RedeployApplicationButton } from './RedeployApplicationButton';
import { RollbackApplicationButton } from './RollbackApplicationButton';
import { ApplicationServicesTable } from './ApplicationServicesTable';
import { ApplicationIngressesTable } from './ApplicationIngressesTable';
import { ApplicationAutoScalingTable } from './ApplicationAutoScalingTable';
import { ApplicationEnvVarsTable } from './ApplicationEnvVarsTable';
import { ApplicationVolumeConfigsTable } from './ApplicationVolumeConfigsTable';
import { ApplicationPersistentDataTable } from './ApplicationPersistentDataTable';
import { PlacementsTable } from './PlacementsTable';

export function ApplicationDetailsWidget() {
  const stateAndParams = useCurrentStateAndParams();
  const {
    params: {
      namespace,
      name,
      'resource-type': resourceType,
      endpointId: environmentId,
    },
  } = stateAndParams;

  const namespaceData = useNamespaceQuery(environmentId, namespace);
  const isSystemNamespace = namespaceData.data?.IsSystem;

  // get app info
  const { data: app } = useApplication(
    environmentId,
    namespace,
    name,
    resourceType
  );
  const externalApp = app && isExternalApplication(app);
  const appStackId = Number(app?.metadata?.labels?.[appStackIdLabel]);
  const appStackFileQuery = useStackFile(appStackId);
  const { data: appServices } = useApplicationServices(
    environmentId,
    namespace,
    name,
    app
  );

  return (
    <div className="row">
      <div className="col-sm-12">
        <Widget>
          <WidgetBody>
            {!isSystemNamespace && (
              <div className="mb-4 flex flex-wrap gap-2">
                <Authorized authorizations="K8sApplicationDetailsW">
                  <Link
                    to="kubernetes.applications.application.edit"
                    data-cy="k8sAppDetail-editAppLink"
                  >
                    <Button
                      type="button"
                      color="light"
                      size="small"
                      className="hover:decoration-none !ml-0"
                      data-cy="k8sAppDetail-editAppButton"
                    >
                      <Icon icon={Pencil} className="mr-1" />
                      {externalApp
                        ? 'Edit external application'
                        : 'Edit this application'}
                    </Button>
                  </Link>
                </Authorized>
                {!applicationIsKind<Pod>('Pod', app) && (
                  <>
                    <RestartApplicationButton />
                    <RedeployApplicationButton
                      environmentId={environmentId}
                      namespace={namespace}
                      appName={name}
                      app={app}
                    />
                  </>
                )}
                {!externalApp && (
                  <RollbackApplicationButton
                    environmentId={environmentId}
                    namespace={namespace}
                    appName={name}
                    app={app}
                  />
                )}
                {appStackFileQuery.data && (
                  <AddButton
                    to="kubernetes.templates.custom.new"
                    data-cy="k8sAppDetail-createCustomTemplateButton"
                    params={{
                      fileContent: appStackFileQuery.data.StackFileContent,
                    }}
                  >
                    Create template from application
                  </AddButton>
                )}
              </div>
            )}
            <ApplicationServicesTable
              environmentId={environmentId}
              appServices={appServices}
            />
            <ApplicationIngressesTable
              appServices={appServices}
              environmentId={environmentId}
              namespace={namespace}
            />
            <ApplicationAutoScalingTable
              environmentId={environmentId}
              namespace={namespace}
              appName={name}
              app={app}
            />
            <ApplicationEnvVarsTable namespace={namespace} app={app} />
            <ApplicationVolumeConfigsTable namespace={namespace} app={app} />
            <ApplicationPersistentDataTable
              environmentId={environmentId}
              namespace={namespace}
              appName={name}
              app={app}
            />
            {!externalApp && <PlacementsTable app={app} />}
          </WidgetBody>
        </Widget>
      </div>
    </div>
  );
}
