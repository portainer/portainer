import { Eye, EyeOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();
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
            data-cy="hide-default-registry-button"
            icon={EyeOff}
            onClick={() => handleShowOrHide(true)}
            disabled={isLimited}
          >
            {t('registries.hide_for_all_users')}
          </Button>
          <BEFeatureIndicator featureId={FeatureId.HIDE_DOCKER_HUB_ANONYMOUS} />
          {isLimited && (
            <Tooltip message={t('registries.hide_tooltip')} />
          )}
        </div>
      ) : (
        <div className="vertical-center">
          <Button
            data-cy="show-default-registry-button"
            icon={Eye}
            onClick={() => handleShowOrHide(false)}
          >
            {t('registries.show_for_all_users')}
          </Button>
          <Tooltip message={t('registries.show_tooltip')} />
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
            t('registries.success'),
            t('registries.default_registry_updated')
          );
        },
      }
    );
  }
}
