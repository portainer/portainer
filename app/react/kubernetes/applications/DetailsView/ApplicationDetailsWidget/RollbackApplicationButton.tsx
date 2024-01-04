import { Pod } from 'kubernetes-types/core/v1';
import { RotateCcw } from 'lucide-react';
import { useRouter } from '@uirouter/react';

import { Authorized } from '@/react/hooks/useUser';
import { notifySuccess, notifyError } from '@/portainer/services/notifications';
import { EnvironmentId } from '@/react/portainer/environments/types';

import { Button } from '@@/buttons';
import { Icon } from '@@/Icon';
import { confirm } from '@@/modals/confirm';
import { ModalType } from '@@/modals';
import { buildConfirmButton } from '@@/modals/utils';
import { TooltipWithChildren } from '@@/Tip/TooltipWithChildren';

import {
  useApplicationRevisionList,
  usePatchApplicationMutation,
} from '../../application.queries';
import {
  applicationIsKind,
  getRollbackPatchPayload,
  matchLabelsToLabelSelectorValue,
} from '../../utils';
import { Application } from '../../types';
import { appDeployMethodLabel } from '../../constants';

type Props = {
  environmentId: EnvironmentId;
  namespace: string;
  appName: string;
  app?: Application;
};

export function RollbackApplicationButton({
  environmentId,
  namespace,
  appName,
  app,
}: Props) {
  const router = useRouter();
  const labelSelector = applicationIsKind<Pod>('Pod', app)
    ? ''
    : matchLabelsToLabelSelectorValue(app?.spec?.selector?.matchLabels);
  const appRevisionListQuery = useApplicationRevisionList(
    environmentId,
    namespace,
    appName,
    app?.metadata?.uid,
    labelSelector,
    app?.kind
  );
  const appRevisionList = appRevisionListQuery.data;
  const appRevisions = appRevisionList?.items;
  const appDeployMethod =
    app?.metadata?.labels?.[appDeployMethodLabel] || 'application form';

  const patchAppMutation = usePatchApplicationMutation(
    environmentId,
    namespace,
    appName
  );

  const isRollbackNotAvailable =
    !app ||
    !appRevisions ||
    appRevisions?.length < 2 ||
    appDeployMethod !== 'application form' ||
    patchAppMutation.isLoading;

  const rollbackButton = (
    <Button
      ng-if="!ctrl.isExternalApplication()"
      type="button"
      color="light"
      size="small"
      className="!ml-0"
      disabled={isRollbackNotAvailable}
      onClick={() => rollbackApplication()}
      data-cy="k8sAppDetail-rollbackButton"
    >
      <Icon icon={RotateCcw} className="mr-1" />
      Rollback to previous configuration
    </Button>
  );

  return (
    <Authorized authorizations="K8sApplicationDetailsW">
      {isRollbackNotAvailable ? (
        <TooltipWithChildren message="Cannot roll back to previous configuration as none currently exists">
          <span>{rollbackButton}</span>
        </TooltipWithChildren>
      ) : (
        rollbackButton
      )}
    </Authorized>
  );

  async function rollbackApplication() {
    // exit early if the application is a pod or there are no revisions
    if (
      !app?.kind ||
      applicationIsKind<Pod>('Pod', app) ||
      !appRevisionList?.items?.length
    ) {
      return;
    }

    // confirm the action
    const confirmed = await confirm({
      title: 'Are you sure?',
      modalType: ModalType.Warn,
      confirmButton: buildConfirmButton('Rollback'),
      message:
        'Rolling back the application to a previous configuration may cause service interruption. Do you wish to continue?',
    });
    if (!confirmed) {
      return;
    }

    try {
      const patch = getRollbackPatchPayload(app, appRevisionList);
      patchAppMutation.mutateAsync(
        { appKind: app.kind, patch },
        {
          onSuccess: () => {
            notifySuccess('Success', 'Application successfully rolled back');
            router.stateService.reload();
          },
          onError: (error) =>
            notifyError(
              'Failure',
              error as Error,
              'Unable to rollback the application'
            ),
        }
      );
    } catch (error) {
      notifyError('Failure', error as Error);
    }
  }
}
