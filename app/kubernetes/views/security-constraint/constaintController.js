// import _ from 'lodash-es';
import angular from 'angular';
import { FeatureId } from 'Portainer/feature-flags/enums';

angular.module('portainer.app').controller('KubernetesSecurityConstraintController', [
  '$scope',
  function ($scope) {
    $scope.limitedFeaturePodSecurityPolicy = FeatureId.POD_SECURITY_POLICY_CONSTRAINT;

    $scope.state = {
      viewReady: false,
      actionInProgress: false,
    };

    async function initView() {
      $scope.state.viewReady = true;
    }

    initView();
  },
]);
