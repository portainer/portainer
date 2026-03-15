import { useCurrentStateAndParams } from '@uirouter/react';
import { Pod } from 'kubernetes-types/core/v1';

import { Authorized } from '@/react/hooks/useUser';
import { useNamespaceQuery } from '@/react/kubernetes/namespaces/queries/useNamespaceQuery';

import { Widget, WidgetBody } from '@@/Widget';
import { AddButton } from '@@/buttons';

import { applicationIsKind, isExternalApplication } from '../../utils';
import { appStackIdLabel, appStackKindLabel } from '../../constants';
import { useApplication } from '../../queries/useApplication';
import { useApplicationServices } from '../../queries/useApplicationServices';
import { useAppStackFile } from '../../queries/useAppStackFile';
import { Application } from '../../types';

import { EdgeEditButton } from './EdgeEditButton';
import { EditButton } from './EditButton';
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

  const { stackId: appStackId, stackKind: appStackKind } =
    getStackDetailsFromLabels(app);

  const externalApp = app && isExternalApplication(app);

  // Use a single query hook that resolves to the stack file content (string)
  // Only fetch stack file for directly managed apps
  const appStackFileQuery = useAppStackFile(
    !externalApp && appStackKind !== 'edge' ? appStackId : undefined,
    appStackKind
  );
  const appStackFileContent = appStackFileQuery.data;

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
                  {appStackKind === 'edge' ? (
                    <EdgeEditButton stackId={appStackId} />
                  ) : (
                    <EditButton to=".edit">
                      {externalApp
                        ? 'Edit external application'
                        : 'Edit this application'}
                    </EditButton>
                  )}
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
                {appStackFileContent && (
                  <AddButton
                    to="kubernetes.templates.custom.new"
                    data-cy="k8sAppDetail-createCustomTemplateButton"
                    params={{
                      fileContent: appStackFileContent,
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

function getStackDetailsFromLabels(app?: Application): {
  stackId?: number;
  stackKind?: string;
} {
  // make undefined when missing so hooks don't run with invalid id
  const appStackId = app?.metadata?.labels?.[appStackIdLabel]
    ? Number(app.metadata.labels[appStackIdLabel])
    : undefined;
  const appStackKind = app?.metadata?.labels?.[appStackKindLabel];
  return { stackId: appStackId, stackKind: appStackKind };
}
