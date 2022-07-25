import angular from 'angular';
import { FeatureId } from 'Portainer/feature-flags/enums';

angular.module('portainer.kubernetes').controller('KubernetesSecurityConstraintController', [
  '$scope',
  'EndpointProvider',
  'EndpointService',
  function ($scope, EndpointProvider, EndpointService) {
    $scope.limitedFeaturePodSecurityPolicy = FeatureId.POD_SECURITY_POLICY_CONSTRAINT;
    $scope.state = {
      viewReady: false,
      actionInProgress: false,
    };

    async function initView() {
      const endpointID = EndpointProvider.endpointID();
      EndpointService.endpoint(endpointID).then((endpoint) => {
        $scope.endpoint = endpoint;
        $scope.state.viewReady = true;
      });
    }

    initView();
  },
]);
