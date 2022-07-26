export default class ContainerCapabilitiesController {
  /* @ngInject */
  constructor($scope) {
    this.$scope = $scope;

    this.oldCapabilities = [];
  }

  createOnChangeHandler(capability) {
    return (checked) => {
      this.$scope.$evalAsync(() => {
        capability.allowed = checked;
      });
    };
  }

  $doCheck() {
    if (this.oldCapabilities.length !== this.capabilities.length) {
      this.oldCapabilities = this.capabilities;
      this.capabilitiesOnChange = Object.fromEntries(this.capabilities.map((cap) => [cap.capability, this.createOnChangeHandler(cap)]));
    }
  }
}
