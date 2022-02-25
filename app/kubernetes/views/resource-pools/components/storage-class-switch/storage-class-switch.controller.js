import { FeatureId } from '@/portainer/feature-flags/enums';

class StorageClassSwitchController {
  /* @ngInject */
  constructor() {
    this.featureId = FeatureId.K8S_RESOURCE_POOL_STORAGE_QUOTA;

    this.handleChange = this.handleChange.bind(this);
  }

  handleChange(value) {
    this.onChange(this.name, value);
  }
}

export default StorageClassSwitchController;
