import { Trash2, Plus } from 'lucide-react';

import { Authorized } from '@/react/hooks/useUser';

import { Link } from '@@/Link';
import { Button } from '@@/buttons';

import { DecoratedStack } from './types';

export function TableActions({
  selectedItems,
  onRemove,
}: {
  selectedItems: Array<DecoratedStack>;
  onRemove: (items: Array<DecoratedStack>) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <Authorized authorizations="PortainerStackDelete">
        <Button
          color="dangerlight"
          disabled={selectedItems.length === 0}
          onClick={() => onRemove(selectedItems)}
          icon={Trash2}
          className="!m-0"
          data-cy="stack-removeStackButton"
        >
          Remove
        </Button>
      </Authorized>

      <Authorized authorizations="PortainerStackCreate">
        <Button
          as={Link}
          props={{ to: '.newstack' }}
          icon={Plus}
          className="!m-0"
          data-cy="stack-addStackButton"
        >
          Add stack
        </Button>
      </Authorized>
    </div>
  );
}
