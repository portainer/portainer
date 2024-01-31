import { notifySuccess } from '@/portainer/services/notifications';

import { LoadingButton } from '@@/buttons';

import { Environment } from '../types';
import { useDisassociateEdgeEnvironment } from '../queries/useDisassociateEdgeEnvironment';

import { confirmDisassociate } from './ConfirmDisassociateModel';

export function DisassociateButton({
  environment,
}: {
  environment: Environment;
}) {
  const mutation = useDisassociateEdgeEnvironment();

  return (
    <LoadingButton
      className="!ml-0"
      loadingText="Disassociating"
      isLoading={mutation.isLoading}
      onClick={handleClick}
      data-cy="disassociate-button"
    >
      Disassociate
    </LoadingButton>
  );

  async function handleClick() {
    if (!(await confirmDisassociate())) {
      return;
    }

    mutation.mutate(environment.Id, {
      onSuccess() {
        notifySuccess('Environment disassociated', environment.Name);
      },
    });
  }
}
