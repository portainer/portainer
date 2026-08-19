import { CellContext } from '@tanstack/react-table';
import { Search } from 'lucide-react';

import { EnvironmentId } from '@/react/portainer/environments/types';
import { FeatureId } from '@/react/portainer/feature-flags/enums';

import { Link } from '@@/Link';
import { Button } from '@@/buttons';
import { BEFeatureIndicator } from '@@/BEFeatureIndicator';

import { DecoratedRegistry } from '../types';
import { RegistryTypes } from '../../../types/registry';

import { columnHelper } from './helper';
import { DefaultRegistryAction } from './DefaultRegistryAction';

export const actions = columnHelper.display({
  header: 'Actions',
  cell: Cell,
});

const nonBrowsableTypes = [
  RegistryTypes.ANONYMOUS,
  RegistryTypes.DOCKERHUB,
  RegistryTypes.QUAY,
];

function Cell({
  row: { original: item },
}: CellContext<DecoratedRegistry, unknown>) {
  if (!item.Id) {
    return <DefaultRegistryAction />;
  }

  return <BrowseButton registry={item} />;
}

export function BrowseButton({
  registry,
  environmentId,
}: {
  registry: DecoratedRegistry;
  environmentId?: EnvironmentId;
}) {
  const canBrowse = !nonBrowsableTypes.includes(registry.Type);

  if (!canBrowse) {
    return null;
  }

  return (
    <BEFeatureIndicator featureId={FeatureId.REGISTRY_MANAGEMENT}>
      {(isLimited) => (
        <Button
          color="link"
          as={Link}
          props={{
            to: 'portainer.registries.registry.repositories',
            params: { id: registry.Id, endpointId: environmentId },
          }}
          disabled={isLimited}
          icon={Search}
          data-cy={`browse-registry-button-${registry.Name}`}
        >
          Browse
        </Button>
      )}
    </BEFeatureIndicator>
  );
}
