import { EnvironmentId } from '@/react/portainer/environments/types';
import { notifySuccess } from '@/portainer/services/notifications';

import { InformationPanel } from '@@/InformationPanel';
import { LoadingButton } from '@@/buttons';
import { TextTip } from '@@/Tip/TextTip';

import { confirmDisassociate } from '../ConfirmDisassociateModel';

import { useDisassociateEnvironment } from './useDisassociateEnvironment';

interface EdgeInformationPanelProps {
  environmentId: EnvironmentId;
  edgeKey: string;
  edgeId: string;
  platformName: string;
  onSuccess?: () => void;
}

export function EdgeInformationPanel({
  environmentId,
  edgeKey,
  edgeId,
  platformName,
  onSuccess,
}: EdgeInformationPanelProps) {
  const disassociateMutation = useDisassociateEnvironment(environmentId);

  async function handleDisassociate() {
    const confirmed = await confirmDisassociate();
    if (confirmed) {
      disassociateMutation.mutate(undefined, {
        onSuccess() {
          notifySuccess(
            'Environment disassociated',
            'Environment successfully disassociated'
          );
          onSuccess?.();
        },
      });
    }
  }

  return (
    <InformationPanel title="Edge information">
      <div className="text-muted small flex flex-col gap-2">
        <TextTip>
          This Edge environment is associated to an Edge environment (
          {platformName}).
        </TextTip>
        <p>
          Edge key: <code>{edgeKey}</code>
        </p>
        <p>
          Edge identifier: <code>{edgeId}</code>
        </p>
        <p>
          <LoadingButton
            size="small"
            color="primary"
            isLoading={disassociateMutation.isLoading}
            loadingText="Disassociating..."
            onClick={handleDisassociate}
            data-cy="disassociate-environment-button"
          >
            Disassociate
          </LoadingButton>
        </p>
      </div>
    </InformationPanel>
  );
}
