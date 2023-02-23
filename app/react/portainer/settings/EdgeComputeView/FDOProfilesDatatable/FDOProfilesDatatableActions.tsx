import { useQueryClient } from 'react-query';
import { useRouter } from '@uirouter/react';
import { PlusCircle, Trash2 } from 'lucide-react';

import { Profile } from '@/portainer/hostmanagement/fdo/model';
import * as notifications from '@/portainer/services/notifications';
import {
  deleteProfile,
  duplicateProfile,
} from '@/portainer/hostmanagement/fdo/fdo.service';

import { confirm, confirmDestructive } from '@@/modals/confirm';
import { Link } from '@@/Link';
import { Button } from '@@/buttons';
import { buildConfirmButton } from '@@/modals/utils';

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
    <div className="actionBar">
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

      <Button
        disabled={!isFDOEnabled || selectedItems.length < 1}
        color="danger"
        onClick={() => onDeleteProfileClick()}
        icon={Trash2}
      >
        Remove
      </Button>
    </div>
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
    const confirmed = await confirmDestructive({
      title: 'Are you sure?',
      message: 'This action will delete the selected profile(s). Continue?',
      confirmButton: buildConfirmButton('Remove', 'danger'),
    });

    if (!confirmed) {
      return;
    }

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
