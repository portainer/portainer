import { FeatureId } from '@/react/portainer/feature-flags/enums';

import { BETeaserButton } from '@@/BETeaserButton';

export function RestartApplicationButton() {
  return (
    <BETeaserButton
      buttonClassName="!ml-0"
      data-cy="k8sAppDetail-restartButton"
      heading="Rolling restart"
      featureId={FeatureId.K8S_ROLLING_RESTART}
      message="A rolling restart of the application is performed."
      buttonText="Rolling restart"
    />
  );
}
