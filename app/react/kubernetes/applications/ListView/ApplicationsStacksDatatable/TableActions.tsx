import { Trash2 } from 'lucide-react';

import { Authorized } from '@/react/hooks/useUser';

import { Button } from '@@/buttons';

import { KubernetesStack } from '../../types';

export function TableActions({
  selectedItems,
  onRemove,
}: {
  selectedItems: Array<KubernetesStack>;
  onRemove: (selectedItems: Array<KubernetesStack>) => void;
}) {
  return (
    <Authorized authorizations="K8sApplicationsW">
      <Button
        disabled={selectedItems.length === 0}
        color="dangerlight"
        onClick={() => onRemove(selectedItems)}
        icon={Trash2}
        data-cy="k8sApp-removeStackButton"
      >
        Remove
      </Button>
    </Authorized>
  );
}
