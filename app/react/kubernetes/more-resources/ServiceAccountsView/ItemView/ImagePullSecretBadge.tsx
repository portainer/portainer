import { Secret } from 'kubernetes-types/core/v1';

import { useCurrentUser } from '@/react/hooks/useUser';
import { Registry } from '@/react/portainer/registries/types/registry';

import { Badge } from '@@/Badge';
import { Link } from '@@/Link';
import { Tooltip } from '@@/Tip/Tooltip';
import { TooltipWithChildren } from '@@/Tip/TooltipWithChildren';

type Props = {
  secretName: string;
  namespace: string;
  secret: Secret | undefined;
  registry: Registry | undefined;
};

export function ImagePullSecretBadge({
  secretName,
  namespace,
  secret,
  registry,
}: Props) {
  const { isPureAdmin } = useCurrentUser();
  const registryIdStr =
    secret?.metadata?.annotations?.['portainer.io/registry.id'];
  const registryId = registryIdStr
    ? parseInt(registryIdStr, 10) || undefined
    : undefined;

  const registryTooltip = registry && (
    <Tooltip
      position="right"
      message={
        <div className="flex flex-col gap-1">
          <span>
            <span className="font-medium">Registry: </span>
            {isPureAdmin ? (
              <Link
                to="portainer.registries.registry"
                params={{ id: registry.Id }}
                className="!text-inherit underline"
                data-cy={`registry-link-${registry.Id}`}
                rel="noopener noreferrer"
                target="_blank"
              >
                {registry.Name}
              </Link>
            ) : (
              registry.Name
            )}
          </span>
          <span>
            <span className="font-medium">URL: </span>
            {registry.URL}
          </span>
        </div>
      }
    />
  );

  const registryNotFoundMessage =
    'The registry associated with this secret could not be found. It may have been deleted.';
  const showRegistryNotFound = !!registryId && !registry;

  const secretLink = (
    <Link
      to="kubernetes.secrets.secret"
      params={{ name: secretName, namespace }}
      data-cy={`image-pull-secret-link-${secretName}`}
      className="!text-inherit"
    >
      {secretName}
    </Link>
  );

  const missingSecretContent = (
    <>
      {secretName}
      <Tooltip message="This secret doesn't exist in the namespace." />
    </>
  );

  function renderSecretName() {
    const content = secret ? secretLink : missingSecretContent;
    if (showRegistryNotFound) {
      return (
        <TooltipWithChildren message={registryNotFoundMessage}>
          <span>{content}</span>
        </TooltipWithChildren>
      );
    }
    return content;
  }

  return (
    <Badge
      type={secret ? 'info' : 'warn'}
      className="inline-flex min-w-max items-center"
    >
      {renderSecretName()}
      {registryTooltip}
    </Badge>
  );
}
