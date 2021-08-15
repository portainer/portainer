import _ from 'lodash-es';

angular.module('portainer.kubernetes').controller('HelmChartController', [
  '$scope',
  '$q',
  '$state',
  '$anchorScroll',
  'Notifications',
  'HelmChartService',
  '$async',
  'KubernetesResourcePoolService',
  'KubernetesNamespaceHelper',
  function ($scope, $q, $state, $anchorScroll, Notifications, HelmChartService, $async, KubernetesResourcePoolService, KubernetesNamespaceHelper) {
    $scope.state = {
      selectedTemplate: null,
      showCustomValues: false,
      formValidationError: '',
      actionInProgress: false,
      selectedTemplateNote: null,
      resourcePools: '',
      ResourcePool: '',
      selectedDescription: null,
    };

    $scope.formValues = {
      appname: '',
    };

    $scope.installHelmchart = function () {
      $scope.state.actionInProgress = true;
      // pass in app name, namespace, chart name, value
      HelmChartService.helmChartInstall($scope.formValues.appname, $scope.state.ResourcePool.Namespace.Name, $scope.state.selectedTemplate.name)
        .then(function success() {
          Notifications.success('Helm Chart successfully installed');
          $state.go('kubernetes.applications');
        })
        .catch(function error(err) {
          $scope.state.actionInProgress = false;
          Notifications.error('Installation error', err);
          $state.go('kubernetes.helms');
        })
        .finally(function final() {
          //$state.go('kubernetes.applications');
          $scope.state.actionInProgress = false;
        });
    };

    $scope.getHelmValues = function () {
      $scope.state.values = HelmChartService.helmChartValues($scope.state.selectedTemplate.name);
    };

    $scope.unselectTemplate = function (template) {
      template.Selected = false;
      $scope.state.selectedTemplate = null;
    };

    $scope.selectHelmChart = function (template) {
      if ($scope.state.selectedTemplate) {
        $scope.unselectTemplate($scope.state.selectedTemplate);
      }
      //only indicated the selected item as Selected
      template.Selected = true;

      $scope.state.selectedTemplate = template;
      $scope.state.selectedTemplateNote = template.app.description;
      $scope.state.selectedTemplateIcon = template.app.icon;
      $scope.state.selectedTemmplateName = template.app.name;

      $scope.getHelmValues();

      $anchorScroll('view-top');
    };
    function initView() {
      return $async(async () => {
        const [resourcePools] = await Promise.all([KubernetesResourcePoolService.get()]);

        $scope.state.resourcePools = _.filter(resourcePools, (resourcePool) => !KubernetesNamespaceHelper.isSystemNamespace(resourcePool.Namespace.Name));
        $scope.state.ResourcePool = $scope.state.resourcePools[0];

        $q.all({
          templates: HelmChartService.helmChart(),
        })
          .then(function success(data) {
            var templates = data.templates.templates;

            $scope.templates = templates;
          })
          .catch(function error(err) {
            $scope.templates = [];
            Notifications.error('Failure', err, 'An error occured during apps initialization.');
          });
      });
    }

    initView();
  },
]);
