import { EnvironmentId } from '@/react/portainer/environments/types';
import { ContainerId } from '@/react/docker/containers/types';
import { useAuthorizations } from '@/react/hooks/useUser';
import { dockerWebhookUrl } from '@/portainer/helpers/webhookHelper';
import { notifySuccess } from '@/portainer/services/notifications';
import { truncateLeftRight } from '@/portainer/filters/filters';
import { FeatureId } from '@/react/portainer/feature-flags/enums';
import { useWebhooks } from '@/react/portainer/webhooks/useWebhooks';
import { useCreateWebhook } from '@/react/portainer/webhooks/useCreateWebhook';
import { useDeleteWebhook } from '@/react/portainer/webhooks/useDeleteWebhook';
import { WebhookType } from '@/react/portainer/webhooks/types';
import { RegistryId } from '@/react/portainer/registries/types/registry';

import { CopyButton } from '@@/buttons';
import { SwitchField } from '@@/form-components/SwitchField';

import { useCanRecreateContainer } from '../ContainerActionsSection/SecondaryActions/useCanRecreateContainer';

interface Props {
  containerId: ContainerId;
  environmentId: EnvironmentId;
  autoRemove: boolean;
  onSuccess?(): void;
  registryId?: RegistryId;
  partOfSwarmService: boolean;
}

export function WebhookRow({
  containerId,
  environmentId,
  autoRemove,
  registryId,
  onSuccess = () => {},
  partOfSwarmService,
}: Props) {
  const shouldDisplayWebhook = useCanRecreateContainer({
    autoRemove,
    partOfSwarmService,
  });
  const { authorized: canUpdate } = useAuthorizations([
    'DockerContainerUpdate',
  ]);
  const { authorized: canCreateWebhook } = useAuthorizations([
    'PortainerWebhookCreate',
  ]);
  const { authorized: canDeleteWebhook } = useAuthorizations([
    'PortainerWebhookDelete',
  ]);

  const webhooksQuery = useWebhooks(
    { endpointId: environmentId, resourceId: containerId },
    {
      enabled: canUpdate && shouldDisplayWebhook,
    }
  );

  const createWebhookMutation = useCreateWebhook();
  const deleteWebhookMutation = useDeleteWebhook();

  const webhook = webhooksQuery.data?.[0];
  const webhookUrl = webhook ? dockerWebhookUrl(webhook.Token) : '';

  if (!shouldDisplayWebhook) {
    return null;
  }

  const webhookExists = !!webhook;
  const isDisabled =
    !shouldDisplayWebhook ||
    !canUpdate ||
    (webhookExists ? !canDeleteWebhook : !canCreateWebhook);

  function handleWebhookChange(enabled: boolean) {
    if (enabled && !webhookExists) {
      createWebhookMutation.mutate(
        {
          resourceId: containerId,
          environmentId,
          webhookType: WebhookType.DockerContainer,
          registryId,
        },
        {
          onSuccess: () => {
            notifySuccess('Success', 'Webhook created successfully');
            onSuccess();
          },
        }
      );
    } else if (!enabled && webhookExists) {
      deleteWebhookMutation.mutate(
        { webhookId: webhook.Id },
        {
          onSuccess: () => {
            notifySuccess('Success', 'Webhook deleted successfully');
            onSuccess();
          },
        }
      );
    }
  }

  return (
    <tr>
      <td>
        <SwitchField
          label="Container webhook"
          checked={webhookExists}
          disabled={isDisabled}
          onChange={handleWebhookChange}
          tooltip="Webhook (or callback URI) used to automate the recreation of this container. Sending a POST request to this callback URI (without requiring any authentication) will pull the most up-to-date version of the associated image and recreate this container."
          data-cy="container-webhook-switch"
          fieldClass="flex items-center gap-2"
          labelClass="!m-0"
          featureId={FeatureId.CONTAINER_WEBHOOK}
        />
      </td>
      <td>
        {!!webhookUrl && (
          <div className="flex items-center gap-2">
            <span className="text-muted">{truncateLeftRight(webhookUrl)}</span>
            <CopyButton
              copyText={webhookUrl}
              data-cy="container-webhook-copy-button"
            >
              Copy link
            </CopyButton>
          </div>
        )}
      </td>
    </tr>
  );
}
