import { useQueryClient } from 'react-query';
import { useRouter } from '@uirouter/react';

import { Button } from '@/portainer/components/Button';
import { Profile } from '@/portainer/hostmanagement/fdo/model';
import { Link } from '@/portainer/components/Link';
import { confirmAsync } from '@/portainer/services/modal.service/confirm';
import * as notifications from '@/portainer/services/notifications';
import {
  deleteProfile,
  duplicateProfile,
} from '@/portainer/hostmanagement/fdo/fdo.service';

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
        <Button disabled={!isFDOEnabled}>
          <i className="fa fa-plus-circle space-right" aria-hidden="true" />
          Add Profile
        </Button>
      </Link>

      <Button
        disabled={!isFDOEnabled || selectedItems.length !== 1}
        onClick={() => onDuplicateProfileClick()}
      >
        <i className="fa fa-plus-circle space-right" aria-hidden="true" />
        Duplicate
      </Button>

      <Button
        disabled={!isFDOEnabled || selectedItems.length < 1}
        color="danger"
        onClick={() => onDeleteProfileClick()}
      >
        <i className="fa fa-trash-alt space-right" aria-hidden="true" />
        Remove
      </Button>
    </div>
  );

  async function onDuplicateProfileClick() {
    const confirmed = await confirmAsync({
      title: 'Are you sure ?',
      message: 'This action will duplicate the selected profile. Continue?',
      buttons: {
        confirm: {
          label: 'Confirm',
          className: 'btn-primary',
        },
      },
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
    const confirmed = await confirmAsync({
      title: 'Are you sure ?',
      message: 'This action will delete the selected profile(s). Continue?',
      buttons: {
        confirm: {
          label: 'Remove',
          className: 'btn-danger',
        },
      },
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
