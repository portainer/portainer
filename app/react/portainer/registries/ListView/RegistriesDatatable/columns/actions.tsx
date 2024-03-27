import { CellContext } from '@tanstack/react-table';
import { Search } from 'lucide-react';

import { EnvironmentId } from '@/react/portainer/environments/types';
import { FeatureId } from '@/react/portainer/feature-flags/enums';

import { Link } from '@@/Link';
import { Button } from '@@/buttons';
import { BEFeatureIndicator } from '@@/BEFeatureIndicator';

import { DecoratedRegistry } from '../types';
import { RegistryId, RegistryTypes } from '../../../types/registry';

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

  return <BrowseButton registryId={item.Id} registryType={item.Type} />;
}

export function BrowseButton({
  registryId,
  registryType,
  environmentId,
}: {
  registryId: RegistryId;
  registryType: RegistryTypes;
  environmentId?: EnvironmentId;
}) {
  const canBrowse = !nonBrowsableTypes.includes(registryType);

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
            params: { id: registryId, endpointId: environmentId },
          }}
          disabled={isLimited}
          icon={Search}
        >
          Browse
        </Button>
      )}
    </BEFeatureIndicator>
  );
}
