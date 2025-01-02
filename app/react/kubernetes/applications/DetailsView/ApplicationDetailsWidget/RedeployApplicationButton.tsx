import { RotateCw } from 'lucide-react';
import { Pod } from 'kubernetes-types/core/v1';
import { useRouter } from '@uirouter/react';

import { EnvironmentId } from '@/react/portainer/environments/types';
import { notifySuccess, notifyError } from '@/portainer/services/notifications';
import { Authorized } from '@/react/hooks/useUser';

import { confirm } from '@@/modals/confirm';
import { ModalType } from '@@/modals';
import { buildConfirmButton } from '@@/modals/utils';
import { Button } from '@@/buttons';
import { Icon } from '@@/Icon';

import { Application } from '../../types';
import {
  applicationIsKind,
  matchLabelsToLabelSelectorValue,
} from '../../utils';
import { useRedeployApplicationMutation } from '../../queries/useRedeployApplicationMutation';

type Props = {
  environmentId: EnvironmentId;
  namespace: string;
  appName: string;
  app?: Application;
};

export function RedeployApplicationButton({
  environmentId,
  namespace,
  appName,
  app,
}: Props) {
  const router = useRouter();
  const redeployAppMutation = useRedeployApplicationMutation(
    environmentId,
    namespace,
    appName
  );

  return (
    <Authorized authorizations="K8sPodDelete">
      <Button
        type="button"
        size="small"
        color="light"
        className="!ml-0"
        disabled={redeployAppMutation.isLoading || !app}
        onClick={() => redeployApplication()}
        data-cy="k8sAppDetail-redeployButton"
      >
        <Icon icon={RotateCw} className="mr-1" />
        Redeploy
      </Button>
    </Authorized>
  );

  async function redeployApplication() {
    // validate
    if (!app || applicationIsKind<Pod>('Pod', app)) {
      return;
    }
    try {
      if (!app?.spec?.selector?.matchLabels) {
        throw new Error(
          `Application has no 'matchLabels' selector to redeploy pods.`
        );
      }
    } catch (error) {
      notifyError('Failure', error as Error);
      return;
    }

    // confirm the action
    const confirmed = await confirm({
      title: 'Are you sure?',
      modalType: ModalType.Warn,
      confirmButton: buildConfirmButton('Redeploy'),
      message:
        'Redeploying terminates and restarts the application, which will cause service interruption. Do you wish to continue?',
    });
    if (!confirmed) {
      return;
    }

    // using the matchlabels object, delete the associated pods with redeployAppMutation
    const labelSelector = matchLabelsToLabelSelectorValue(
      app?.spec?.selector?.matchLabels
    );
    redeployAppMutation.mutateAsync(
      { labelSelector },
      {
        onSuccess: () => {
          notifySuccess('Success', 'Application successfully redeployed');
          router.stateService.reload();
        },
      }
    );
  }
}
