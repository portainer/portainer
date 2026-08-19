import { RotateCcw } from 'lucide-react';
import { useRouter } from '@uirouter/react';

import { EnvironmentId } from '@/react/portainer/environments/types';
import { notifySuccess } from '@/portainer/services/notifications';

import { LoadingButton } from '@@/buttons';
import { buildConfirmButton } from '@@/modals/utils';
import { confirm } from '@@/modals/confirm';
import { ModalType } from '@@/modals';

import { useHelmRollbackMutation } from '../../helmReleaseQueries/useHelmRollbackMutation';

type Props = {
  latestRevision: number;
  selectedRevision?: number;
  environmentId: EnvironmentId;
  releaseName: string;
  namespace?: string;
};

export function RollbackButton({
  latestRevision,
  selectedRevision,
  environmentId,
  releaseName,
  namespace,
}: Props) {
  // when the latest revision is selected, rollback to the previous revision
  // otherwise, rollback to the selected revision
  const rollbackRevision =
    selectedRevision === latestRevision ? latestRevision - 1 : selectedRevision;
  const router = useRouter();
  const rollbackMutation = useHelmRollbackMutation(environmentId);

  return (
    <LoadingButton
      onClick={handleClick}
      isLoading={rollbackMutation.isLoading}
      loadingText="Rolling back..."
      data-cy="rollback-button"
      icon={RotateCcw}
      color="default"
      size="medium"
    >
      Rollback to #{rollbackRevision}
    </LoadingButton>
  );

  async function handleClick() {
    const confirmed = await confirm({
      title: 'Are you sure?',
      modalType: ModalType.Warn,
      confirmButton: buildConfirmButton('Rollback'),
      message: `Rolling back will restore the application to revision #${rollbackRevision}, which could cause service interruption. Do you wish to continue?`,
    });
    if (!confirmed) {
      return;
    }

    rollbackMutation.mutate(
      {
        releaseName,
        params: { namespace, revision: rollbackRevision },
      },
      {
        onSuccess: () => {
          notifySuccess(
            'Success',
            `Application rolled back to revision #${rollbackRevision} successfully.`
          );
          // set the revision url param to undefined to refresh the page at the latest revision
          router.stateService.go('kubernetes.helm', {
            namespace,
            name: releaseName,
            revision: undefined,
          });
        },
      }
    );
  }
}
