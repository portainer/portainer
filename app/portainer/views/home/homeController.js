import { isEdgeEnvironment } from '@/portainer/environments/utils';

angular
  .module('portainer.app')
  .controller('HomeController', function ($scope, $state, TagService, EndpointService, GroupService, Notifications, StateManager, ModalService, MotdService) {
    $scope.state = {
      connectingToEdgeEndpoint: false,
      homepageLoadTime: '',
    };

    $scope.goToDashboard = function (endpoint) {
      if (isEdgeEnvironment(endpoint.Type) && endpoint.EdgeID) {
        $scope.state.connectingToEdgeEndpoint = true;
      }
    };

    $scope.dismissImportantInformation = function (hash) {
      StateManager.dismissImportantInformation(hash);
    };

    $scope.dismissInformationPanel = function (id) {
      StateManager.dismissInformationPanel(id);
    };

    $scope.triggerSnapshot = function () {
      ModalService.confirmEndpointSnapshot(function (result) {
        if (!result) {
          return;
        }
        triggerSnapshot();
      });
    };

    function triggerSnapshot() {
      EndpointService.snapshotEndpoints()
        .then(function success() {
          Notifications.success('Success', 'Environments updated');
          $state.reload();
        })
        .catch(function error(err) {
          Notifications.error('Failure', err, 'An error occurred during environment snapshot');
        });
    }

    async function initView() {
      return $scope.$evalAsync(async () => {
        $scope.state.homepageLoadTime = Math.floor(Date.now() / 1000);

        MotdService.motd().then(function success(data) {
          $scope.motd = data;
        });

        try {
          const [tags, groups] = await Promise.all([TagService.tags(), GroupService.groups()]);
          $scope.tags = tags;
          $scope.groups = groups;
        } catch (err) {
          Notifications.error('Failed loading page data', err);
        }
      });
    }

    initView();
  });
