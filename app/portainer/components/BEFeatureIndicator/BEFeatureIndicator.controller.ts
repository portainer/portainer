import { FeatureId } from '@/portainer/feature-flags/enums';
import { getFeatureDetails } from '@/react/components/BEFeatureIndicator/utils';

export default class BeIndicatorController {
  limitedToBE?: boolean;

  url?: string;

  feature?: FeatureId;

  /* @ngInject */
  constructor() {
    this.limitedToBE = false;
    this.url = '';
  }

  $onInit() {
    const { url, limitedToBE } = getFeatureDetails(this.feature);

    this.limitedToBE = limitedToBE;
    this.url = url;
  }
}
