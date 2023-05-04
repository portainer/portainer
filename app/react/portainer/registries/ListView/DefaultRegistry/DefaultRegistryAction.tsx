import { Eye, EyeOff } from 'lucide-react';

import { notifySuccess } from '@/portainer/services/notifications';
import { FeatureId } from '@/react/portainer/feature-flags/enums';
import { isLimitedToBE } from '@/react/portainer/feature-flags/feature-flags.service';
import {
  usePublicSettings,
  useUpdateDefaultRegistrySettingsMutation,
} from '@/react/portainer/settings/queries';

import { Tooltip } from '@@/Tip/Tooltip';
import { Button } from '@@/buttons';
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
            color="danger"
            icon={EyeOff}
            onClick={() => handleShowOrHide(true)}
            disabled={isLimited}
          >
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
          <Button icon={Eye} onClick={() => handleShowOrHide(false)}>
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
