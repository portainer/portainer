import { FeatureId } from '@/react/portainer/feature-flags/enums';
class SslCaFileSettingsController {
  /* @ngInject */
  constructor() {
    this.limitedFeature = FeatureId.CA_FILE;
  }
}

export default SslCaFileSettingsController;
