import { useQueryClient } from 'react-query';
import { useRouter } from '@uirouter/react';
import { PlusCircle } from 'lucide-react';

import { Profile } from '@/portainer/hostmanagement/fdo/model';
import * as notifications from '@/portainer/services/notifications';
import {
  deleteProfile,
  duplicateProfile,
} from '@/portainer/hostmanagement/fdo/fdo.service';

import { confirm } from '@@/modals/confirm';
import { Link } from '@@/Link';
import { Button } from '@@/buttons';
import { DeleteButton } from '@@/buttons/DeleteButton';

interface Props {
  isFDOEnabled: boolean;
  selectedItems: Profile[];
}

export function FDOProfilesDatatableActions({
  isFDOEnabled,
  selectedItems,
}: Props) {
  const router = useRouter();
  const queryClient = useQueryClient();

  return (
    <>
      <Link to="portainer.endpoints.profile" className="space-left">
        <Button disabled={!isFDOEnabled} icon={PlusCircle}>
          Add Profile
        </Button>
      </Link>

      <Button
        disabled={!isFDOEnabled || selectedItems.length !== 1}
        onClick={() => onDuplicateProfileClick()}
        icon={PlusCircle}
      >
        Duplicate
      </Button>

      <DeleteButton
        disabled={!isFDOEnabled || selectedItems.length === 0}
        onConfirmed={() => onDeleteProfileClick()}
        confirmMessage="This action will delete the selected profile(s). Continue?"
      />
    </>
  );

  async function onDuplicateProfileClick() {
    const confirmed = await confirm({
      title: 'Are you sure ?',
      message: 'This action will duplicate the selected profile. Continue?',
    });

    if (!confirmed) {
      return;
    }

    try {
      const profile = selectedItems[0];
      const newProfile = await duplicateProfile(profile.id);
      notifications.success('Profile successfully duplicated', profile.name);
      router.stateService.go('portainer.endpoints.profile.edit', {
        id: newProfile.id,
      });
    } catch (err) {
      notifications.error(
        'Failure',
        err as Error,
        'Unable to duplicate profile'
      );
    }
  }

  async function onDeleteProfileClick() {
    await Promise.all(
      selectedItems.map(async (profile) => {
        try {
          await deleteProfile(profile.id);

          notifications.success('Profile successfully removed', profile.name);
        } catch (err) {
          notifications.error(
            'Failure',
            err as Error,
            'Unable to remove profile'
          );
        }
      })
    );

    await queryClient.invalidateQueries('fdo_profiles');
  }
}
