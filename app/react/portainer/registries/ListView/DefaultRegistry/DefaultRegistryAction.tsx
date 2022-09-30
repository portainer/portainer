import { notifySuccess } from '@/portainer/services/notifications';
import { FeatureId } from '@/portainer/feature-flags/enums';
import { isLimitedToBE } from '@/portainer/feature-flags/feature-flags.service';
import {
  usePublicSettings,
  useUpdateDefaultRegistrySettingsMutation,
} from '@/react/portainer/settings/queries';

import { Tooltip } from '@@/Tip/Tooltip';
import { Button } from '@@/buttons';
import { Icon } from '@@/Icon';
import { BEFeatureIndicator } from '@@/BEFeatureIndicator';

export function DefaultRegistryAction() {
  const settingsQuery = usePublicSettings({
    select: (settings) => settings.DefaultRegistry?.Hide,
  });
  const defaultRegistryMutation = useUpdateDefaultRegistrySettingsMutation();

  if (!settingsQuery.isSuccess) {
    return null;
  }
  const hideDefaultRegistry = settingsQuery.data;

  const isLimited = isLimitedToBE(FeatureId.HIDE_DOCKER_HUB_ANONYMOUS);

  return (
    <>
      {!hideDefaultRegistry ? (
        <div className="vertical-center">
          <Button
            className="btn btn-xs btn-light vertical-center"
            onClick={() => handleShowOrHide(true)}
            disabled={isLimited}
          >
            <Icon icon="eye-off" feather />
            Hide for all users
          </Button>
          <BEFeatureIndicator featureId={FeatureId.HIDE_DOCKER_HUB_ANONYMOUS} />
          {isLimited ? null : (
            <Tooltip
              message="This hides the option in any registry dropdown prompts but does not prevent a user from deploying anonymously from Docker Hub directly via YAML.
            Note: Docker Hub (anonymous) will continue to show as the ONLY option if there are NO other registries available to the user."
            />
          )}
        </div>
      ) : (
        <div className="vertical-center">
          <Button
            className="btn btn-xs btn-success vertical-center"
            onClick={() => handleShowOrHide(false)}
          >
            <Icon icon="eye" feather />
            Show for all users
          </Button>
          <Tooltip
            message="This reveals the option in any registry dropdown prompts.
                    (but note that the Docker Hub (anonymous) option only shows if there is no credentialled Docker Hub option available to the user)."
          />
        </div>
      )}
    </>
  );

  function handleShowOrHide(hideDefaultRegistry: boolean) {
    defaultRegistryMutation.mutate(
      {
        Hide: hideDefaultRegistry,
      },
      {
        onSuccess() {
          notifySuccess(
            'Success',
            'Default registry Settings updated successfully'
          );
        },
      }
    );
  }
}
