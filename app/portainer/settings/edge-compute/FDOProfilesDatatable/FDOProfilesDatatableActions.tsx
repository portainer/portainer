import { useQueryClient } from 'react-query';

import { Button } from '@/portainer/components/Button';
import { Profile } from '@/portainer/hostmanagement/fdo/model';
import { Link } from '@/portainer/components/Link';
import { confirmAsync } from '@/portainer/services/modal.service/confirm';
import * as notifications from '@/portainer/services/notifications';
import { deleteProfile } from '@/portainer/hostmanagement/fdo/fdo.service';

interface Props {
  selectedItems: Profile[];
}

export function FDOProfilesDatatableActions({ selectedItems }: Props) {
  const queryClient = useQueryClient();

  return (
    <div className="actionBar">
      <Link to="portainer.endpoints.newProfile" className="space-left">
        <Button>
          <i className="fa fa-plus-circle space-right" aria-hidden="true" />
          Add New
        </Button>
      </Link>

      <Button disabled={selectedItems.length !== 1} onClick={() => {}}>
        <i className="fa fa-plus-circle space-right" aria-hidden="true" />
        Duplicate
      </Button>

      <Button
        disabled={selectedItems.length < 1}
        color="danger"
        onClick={() => onDeleteProfileClick()}
      >
        <i className="fa fa-trash-alt space-right" aria-hidden="true" />
        Remove
      </Button>
    </div>
  );

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
