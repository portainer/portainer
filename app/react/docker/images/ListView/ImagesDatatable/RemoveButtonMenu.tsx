import { ChevronDown, Trash2 } from 'lucide-react';
import { Menu, MenuButton, MenuItem, MenuPopover } from '@reach/menu-button';
import { positionRight } from '@reach/popover';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { Authorized } from '@/react/hooks/useUser';
import { withInvalidate } from '@/react-tools/react-query';
import { promiseSequence } from '@/portainer/helpers/promise-utils';
import { useEnvironmentId } from '@/react/hooks/useEnvironmentId';
import { notifySuccess } from '@/portainer/services/notifications';

import { Button, ButtonGroup } from '@@/buttons';
import { ButtonWithRef } from '@@/buttons/Button';
import { confirmDestructive } from '@@/modals/confirm';
import { buildConfirmButton } from '@@/modals/utils';

import { ImagesListResponse } from '../../queries/useImages';
import { queryKeys } from '../../queries/queryKeys';
import { deleteImage } from '../../queries/useDeleteImageMutation';

export function RemoveButtonMenu({
  selectedItems,
}: {
  selectedItems: Array<ImagesListResponse>;
}) {
  const deleteImageListMutation = useDeleteImageListMutation();

  return (
    <Authorized authorizations="DockerImageDelete">
      <ButtonGroup>
        <Button
          size="small"
          color="dangerlight"
          icon={Trash2}
          disabled={selectedItems.length === 0}
          data-cy="image-removeImageButton"
          onClick={() => {
            handleRemove(false);
          }}
        >
          Remove
        </Button>
        <Menu>
          <MenuButton
            as={ButtonWithRef}
            size="small"
            color="dangerlight"
            disabled={selectedItems.length === 0}
            icon={ChevronDown}
            data-cy="image-toggleRemoveButtonMenu"
          >
            <span className="sr-only">Toggle Dropdown</span>
          </MenuButton>
          <MenuPopover position={positionRight}>
            <div className="mt-3 bg-white th-highcontrast:bg-black th-dark:bg-black">
              <MenuItem
                onSelect={() => {
                  handleRemove(true);
                }}
              >
                Force Remove
              </MenuItem>
            </div>
          </MenuPopover>
        </Menu>
      </ButtonGroup>
    </Authorized>
  );

  function confirmForceRemove() {
    return confirmDestructive({
      title: 'Are you sure?',
      message:
        "Forcing removal of an image will remove it even if it's used by stopped containers, and delete all associated tags. Are you sure you want to remove the selected image(s)?",
      confirmButton: buildConfirmButton('Remove the image', 'danger'),
    });
  }

  function confirmRegularRemove() {
    return confirmDestructive({
      title: 'Are you sure?',
      message:
        'Removing an image will also delete all associated tags. Are you sure you want to remove the selected image(s)?',
      confirmButton: buildConfirmButton('Remove the image', 'danger'),
    });
  }

  async function handleRemove(force: boolean) {
    const confirmed = await (force
      ? confirmForceRemove()
      : confirmRegularRemove());

    if (!confirmed) {
      return;
    }

    deleteImageListMutation.mutate(
      {
        imageIds: selectedItems.map((image) => image.id),
        force,
      },
      { onSuccess() {} }
    );
  }
}

function useDeleteImageListMutation() {
  const environmentId = useEnvironmentId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      imageIds,
      ...args
    }: {
      imageIds: Array<string>;
    } & Omit<Parameters<typeof deleteImage>[0], 'imageId' | 'environmentId'>) =>
      promiseSequence(
        imageIds.map(
          (imageId) => () =>
            deleteImage({ ...args, environmentId, imageId }).then(() =>
              notifySuccess('Image successfully removed', imageId)
            )
        )
      ),
    ...withInvalidate(queryClient, [queryKeys.base(environmentId)]),
  });
}
