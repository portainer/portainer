import { Pod } from 'kubernetes-types/core/v1';

import { Stack } from '@/react/common/stacks/types';
import { EnvironmentId } from '@/react/portainer/environments/types';
import { isGitConfigDiverged } from '@/react/portainer/gitops/utils';

import { AddButton } from '@@/buttons';

import { useAppStackFile } from '../../queries/useAppStackFile';
import { Application } from '../../types';
import { applicationIsKind } from '../../utils';

import { EditButtons } from './EditButtons';
import { RedeployApplicationButton } from './RedeployApplicationButton';
import { RestartApplicationButton } from './RestartApplicationButton';
import { RollbackApplicationButton } from './RollbackApplicationButton';

export function ButtonsLine({
  stack,
  environmentId,
  externalApp,
  appStackId,
  appStackKind,
  app,
  name,
  namespace,
}: {
  stack?: Stack;
  externalApp: boolean;
  environmentId: EnvironmentId;
  appStackId?: number;
  appStackKind?: string;
  namespace: string;
  app?: Application;
  name: string;
}) {
  const appStackFileQuery = useAppStackFile(
    {
      id: stack?.Id ?? appStackId,
      kind: appStackKind,
    },
    {
      enabled:
        stack &&
        (!stack.GitConfig ||
          !isGitConfigDiverged(stack.GitConfig, stack.CurrentDeploymentInfo)),
    }
  );
  const appStackFileContent = appStackFileQuery.data;

  return (
    <div className="flex flex-wrap gap-2">
      <EditButtons
        isEdge={appStackKind === 'edge'}
        stackId={stack?.Id ?? appStackId}
        externalApp={externalApp}
        stack={stack}
      />
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
  );
}
