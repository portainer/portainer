import { notifySuccess } from '@/portainer/services/notifications';
import { EnvironmentId } from '@/react/portainer/environments/types';

import { LoadingButton } from '@@/buttons';
import { confirmUpdate } from '@@/modals/confirm';

import { useToggleSystemNamespaceMutation } from '../../queries/useToggleSystemNamespace';

export function ToggleSystemNamespaceButton({
  isSystemNamespace,
  isEdit,
  environmentId,
  namespaceName,
}: {
  isSystemNamespace: boolean;
  isEdit: boolean;
  environmentId: EnvironmentId;
  namespaceName: string;
}) {
  const toggleSystemNamespaceMutation = useToggleSystemNamespaceMutation(
    environmentId,
    namespaceName
  );
  if (!isEdit) {
    return null;
  }

  return (
    <LoadingButton
      onClick={markUnmarkAsSystem}
      className="!ml-0"
      data-cy="mark-as-system-button"
      color="default"
      type="button"
      loadingText={
        isSystemNamespace ? 'Unmarking as system' : 'Marking as system'
      }
      isLoading={toggleSystemNamespaceMutation.isLoading}
    >
      {isSystemNamespace ? 'Unmark as system' : 'Mark as system'}
    </LoadingButton>
  );

  async function markUnmarkAsSystem() {
    const confirmed = await confirmMarkUnmarkAsSystem(isSystemNamespace);
    if (confirmed) {
      toggleSystemNamespaceMutation.mutate(!isSystemNamespace, {
        onSuccess: () => {
          notifySuccess('Success', 'Namespace updated');
        },
      });
    }
  }
}

async function confirmMarkUnmarkAsSystem(isSystemNamespace: boolean) {
  const message = isSystemNamespace
    ? 'Unmarking this namespace as system will allow non administrator users to manage it and the resources in contains depending on the access control settings. Are you sure?'
    : 'Marking this namespace as a system namespace will prevent non administrator users from managing it and the resources it contains. Are you sure?';

  return new Promise((resolve) => {
    confirmUpdate(message, resolve);
  });
}
