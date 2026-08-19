import { PencilIcon } from 'lucide-react';
import { Secret } from 'kubernetes-types/core/v1';

import { Registry } from '@/react/portainer/registries/types/registry';

import { Badge } from '@@/Badge';
import { Button } from '@@/buttons/Button';
import { TooltipWithChildren } from '@@/Tip/TooltipWithChildren';

import { ImagePullSecretBadge } from './ImagePullSecretBadge';

const MAX_VISIBLE_SECRETS = 5;

type ImagePullSecret = {
  name: string;
  secret: Secret | undefined;
  registry: Registry | undefined;
};

type Props = {
  imagePullSecrets: ImagePullSecret[];
  namespace: string;
  isDefaultServiceAccount: boolean;
  canEdit: boolean;
  isSystem?: boolean;
  onEdit: () => void;
};

export function ImagePullSecretsList({
  imagePullSecrets,
  namespace,
  isDefaultServiceAccount,
  canEdit,
  isSystem,
  onEdit,
}: Props) {
  const visibleSecrets = imagePullSecrets.slice(0, MAX_VISIBLE_SECRETS);
  const hiddenSecrets = imagePullSecrets.slice(MAX_VISIBLE_SECRETS);

  return (
    <div className="flex items-center gap-2">
      {visibleSecrets.length > 0 ? (
        <div className="flex h-fit flex-wrap gap-1">
          {visibleSecrets.map((imagePullSecret) => (
            <ImagePullSecretBadge
              key={imagePullSecret.name}
              secretName={imagePullSecret.name}
              namespace={namespace}
              secret={imagePullSecret.secret}
              registry={imagePullSecret.registry}
            />
          ))}
          {hiddenSecrets.length > 0 && (
            <TooltipWithChildren
              message={hiddenSecrets.map((secret) => secret.name).join(', ')}
            >
              <span>
                <Badge type="muted" className="min-w-max cursor-default">
                  + {hiddenSecrets.length} more
                </Badge>
              </span>
            </TooltipWithChildren>
          )}
        </div>
      ) : (
        <ImagePullSecretsEmptyState
          isDefaultServiceAccount={isDefaultServiceAccount}
        />
      )}
      {canEdit && !isSystem && (
        <Button
          color="light"
          size="small"
          icon={PencilIcon}
          onClick={onEdit}
          data-cy="k8sSADetail-imagePullSecrets-edit"
          className="h-[34px]"
        >
          Edit
        </Button>
      )}
    </div>
  );
}

function ImagePullSecretsEmptyState({
  isDefaultServiceAccount,
}: {
  isDefaultServiceAccount: boolean;
}) {
  return (
    <span className="text-muted">
      {isDefaultServiceAccount ? (
        <>
          No image pull secrets configured. Pods in this namespace without an
          explicit service account must specify <code>imagePullSecrets</code>{' '}
          manually. Add a secret here so they can pull images automatically.
        </>
      ) : (
        <>
          No image pull secrets configured. Pods using this service account must
          specify <code>imagePullSecrets</code> manually. Add a secret here so
          pods using this service account can pull images automatically.
        </>
      )}
    </span>
  );
}
