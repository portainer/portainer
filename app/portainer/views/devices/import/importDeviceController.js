angular
  .module('portainer.app')
  .controller('ImportDeviceController', function ImportDeviceController(
    $async,
    $analytics,
    $q,
    $scope,
    $state,
    $filter,
    clipboard,
    EndpointService,
    GroupService,
    TagService,
    SettingsService,
    Notifications,
    Authentication
  ) {
    $scope.state = {
      actionInProgress: false,
      allowCreateTag: Authentication.isAdmin(),
    };

    $scope.formValues = {
      DeviceName: '',
      DeviceProfile: '',
      GroupId: 1,
      TagIds: [],
    };

    $scope.onCreateTag = function onCreateTag(tagName) {
      return $async(onCreateTagAsync, tagName);
    };

    async function onCreateTagAsync(tagName) {
      try {
        const tag = await TagService.createTag(tagName);
        $scope.availableTags = $scope.availableTags.concat(tag);
        $scope.formValues.TagIds = $scope.formValues.TagIds.concat(tag.Id);
      } catch (err) {
        Notifications.error('Failure', err, 'Unable to create tag');
      }
    }

    // TODO submit
    $scope.saveDevice = function () {
      console.log('saveDevice');
      return $async(async () => {
        $scope.state.actionInProgress = true;
        try {
          // const endpoint = await EndpointService.createRemoteEndpoint();

          Notifications.success('Environment created', name);
        } catch (err) {
          Notifications.error('Failure', err, 'Unable to create environment');
        } finally {
          $scope.state.actionInProgress = false;
        }
      });
    };

    function initView() {
      $q.all({
        groups: GroupService.groups(),
        tags: TagService.tags(),
        settings: SettingsService.settings(),
      })
        .then(function success(data) {
          $scope.groups = data.groups;
          $scope.availableTags = data.tags;

          // const settings = data.settings;
        })
        .catch(function error(err) {
          Notifications.error('Failure', err, 'Unable to load groups');
        });
    }

    initView();
  });
