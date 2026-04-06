import { useTranslation } from 'react-i18next';

import { Authorized } from '@/react/hooks/useUser';

import { AddButton } from '@@/buttons';
import { DeleteButton } from '@@/buttons/DeleteButton';

import { DecoratedVolume } from '../types';

export function TableActions({
  selectedItems,
  onRemove,
}: {
  selectedItems: Array<DecoratedVolume>;
  onRemove(items: Array<DecoratedVolume>): void;
}) {
  const { t } = useTranslation();
  return (
    <div className="flex items-center gap-2">
      <Authorized authorizations="DockerVolumeDelete">
        <DeleteButton
          disabled={selectedItems.length === 0}
          onConfirmed={() => onRemove(selectedItems)}
          confirmMessage={t('docker.volumes.confirm_remove')}
          data-cy="volume-removeVolumeButton"
        />
      </Authorized>
      <Authorized authorizations="DockerVolumeCreate">
        <AddButton data-cy="volume-addVolumeButton">Add volume</AddButton>
      </Authorized>
    </div>
  );
}
