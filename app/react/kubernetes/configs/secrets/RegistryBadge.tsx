import { useCurrentUser } from '@/react/hooks/useUser';
import { useRegistry } from '@/react/portainer/registries/queries/useRegistry';

import { Badge } from '@@/Badge';
import { Link } from '@@/Link';
import { InlineLoader } from '@@/InlineLoader/InlineLoader';
import { Tooltip } from '@@/Tip/Tooltip';

type Props = {
  registryId: number;
  children?: React.ReactNode;
  dataCy?: string;
};

export function RegistryBadge({ registryId, children, dataCy }: Props) {
  const registryQuery = useRegistry(registryId, false);
  const { isPureAdmin } = useCurrentUser();

  if (registryQuery.isLoading) {
    return <InlineLoader>Loading registry...</InlineLoader>;
  }

  if (registryQuery.isError || !registryQuery.data) {
    return (
      <Badge type="warn">
        Registry not found
        <Tooltip message="The registry associated with this secret could not be found. It may have been deleted." />
      </Badge>
    );
  }

  const { Name } = registryQuery.data;

  return (
    <Badge type="muted" data-cy={dataCy}>
      {isPureAdmin ? (
        <Link
          to="portainer.registries.registry"
          params={{ id: registryId }}
          className="!text-inherit"
          data-cy={dataCy ? `${dataCy}-link` : 'registry-badge-link'}
        >
          {Name}
        </Link>
      ) : (
        Name
      )}
      {children}
    </Badge>
  );
}
