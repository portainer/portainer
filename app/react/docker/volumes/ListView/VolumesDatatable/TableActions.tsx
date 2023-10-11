import { Plus, Trash2 } from 'lucide-react';

import { Authorized } from '@/react/hooks/useUser';

import { Link } from '@@/Link';
import { Button } from '@@/buttons';

import { DecoratedVolume } from '../types';

export function TableActions({
  selectedItems,
  onRemove,
}: {
  selectedItems: Array<DecoratedVolume>;
  onRemove(items: Array<DecoratedVolume>): void;
}) {
  return (
    <div className="flex items-center gap-2">
      <Authorized authorizations="DockerVolumeDelete">
        <Button
          color="dangerlight"
          disabled={selectedItems.length === 0}
          onClick={() => onRemove(selectedItems)}
          icon={Trash2}
          className="!m-0"
          data-cy="volume-removeVolumeButton"
        >
          Remove
        </Button>
      </Authorized>
      <Authorized authorizations="DockerVolumeCreate">
        <Button
          as={Link}
          props={{ to: '.new' }}
          icon={Plus}
          className="!m-0"
          data-cy="volume-addVolumeButton"
        >
          Add secret
        </Button>
      </Authorized>
    </div>
  );
}
