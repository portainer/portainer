import { useCurrentStateAndParams } from '@uirouter/react';

import { useNamespaceQuery } from '@/react/kubernetes/namespaces/queries/useNamespaceQuery';
import { useStack } from '@/react/common/stacks/queries/useStack';
import { GitReferenceCard } from '@/react/portainer/gitops/GitReferenceCard';

import { Widget, WidgetBody } from '@@/Widget';

import { isExternalApplication } from '../../utils';
import { appStackIdLabel, appStackKindLabel } from '../../constants';
import { useApplication } from '../../queries/useApplication';
import { useApplicationServices } from '../../queries/useApplicationServices';
import { Application } from '../../types';

import { ApplicationServicesTable } from './ApplicationServicesTable';
import { ApplicationIngressesTable } from './ApplicationIngressesTable';
import { ApplicationAutoScalingTable } from './ApplicationAutoScalingTable';
import { ApplicationEnvVarsTable } from './ApplicationEnvVarsTable';
import { ApplicationVolumeConfigsTable } from './ApplicationVolumeConfigsTable';
import { ApplicationPersistentDataTable } from './ApplicationPersistentDataTable';
import { PlacementsTable } from './PlacementsTable';
import { ButtonsLine } from './ButtonsLine';

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

  const { data: app } = useApplication(
    environmentId,
    namespace,
    name,
    resourceType
  );

  const { stackId: appStackId, stackKind: appStackKind } =
    getStackDetailsFromLabels(app);

  const externalApp = !!app && isExternalApplication(app);

  const isManagedStack =
    !!appStackId && !externalApp && appStackKind !== 'edge';

  const stackQuery = useStack(appStackId, { enabled: isManagedStack });

  const { data: appServices } = useApplicationServices(
    environmentId,
    namespace,
    name,
    app
  );

  const stack = stackQuery?.data;

  return (
    <div className="row">
      <div className="col-sm-12">
        <Widget>
          <WidgetBody>
            {!isSystemNamespace && (
              <>
                {!!stack?.GitConfig && (
                  <div className="mb-4">
                    <GitReferenceCard
                      stackId={stack.Id}
                      autoUpdate={stack.AutoUpdate}
                      gitConfig={stack.GitConfig}
                      currentDeploymentInfo={stack.CurrentDeploymentInfo}
                      stackType="kubernetes"
                    />
                  </div>
                )}

                <div className="mb-4">
                  <ButtonsLine
                    app={app}
                    environmentId={environmentId}
                    externalApp={externalApp}
                    name={name}
                    namespace={namespace}
                    appStackId={appStackId}
                    appStackKind={appStackKind}
                    stack={stack}
                  />
                </div>
              </>
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
