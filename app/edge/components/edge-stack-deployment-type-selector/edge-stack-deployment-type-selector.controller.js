import { compose, kubernetes } from '@@/BoxSelector/common-options/deployment-methods';

export default class EdgeStackDeploymentTypeSelectorController {
  /* @ngInject */
  constructor() {
    this.deploymentOptions = [
      {
        ...compose,
        value: 0,
      },
      {
        ...kubernetes,
        value: 1,
        disabled: () => {
          return this.hasDockerEndpoint();
        },
        tooltip: () => {
          return this.hasDockerEndpoint() ? 'Cannot use this option with Edge Docker endpoints' : '';
        },
      },
    ];
  }
}
