import { PortainerEndpointCreationTypes } from 'Portainer/models/endpoint/models';
import { configureDevice, getProfiles } from "Portainer/hostmanagement/fdo/fdo.service";

angular
  .module('portainer.app')
  .controller('ImportDeviceController', function ImportDeviceController(
    $async,
    $q,
    $scope,
    $state,
    EndpointService,
    GroupService,
    TagService,
    Notifications,
    Authentication,
    FileUploadService,
  ) {
    $scope.state = {
      actionInProgress: false,
      voucherUploading: false,
      voucherUploaded: false,
      deviceID: '',
      allowCreateTag: Authentication.isAdmin(),
    };

    $scope.formValues = {
      DeviceName: '',
      DeviceProfile: '',
      GroupId: 1,
      TagIds: [],
      VoucherFile: null,
      PortainerURL: '',
    };

    $scope.profiles = [];

    $scope.onVoucherFileChange = function (file) {
      if (!file) {
        return;
      }

      $scope.state.voucherUploading = true;

      FileUploadService.uploadOwnershipVoucher(file)
        .then(function success(response) {
          $scope.state.voucherUploading = false;
          $scope.state.voucherUploaded = true;
          $scope.deviceID = response.data.guid;
        })
        .catch(function error(err) {
          $scope.state.voucherUploading = false;
          Notifications.error('Failure', err, 'Unable to upload Ownership Voucher');
        });
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

    $scope.createEndpointAndConfigureDevice = function () {
      return $async(async () => {
        $scope.state.actionInProgress = true;

        try {
          var endpoint = await EndpointService.createRemoteEndpoint(
            $scope.formValues.DeviceName,
            PortainerEndpointCreationTypes.EdgeAgentEnvironment,
            $scope.formValues.PortainerURL,
            '',
            $scope.formValues.GroupId,
            $scope.formValues.TagIds,
            false,
            false,
            false,
            null,
            null,
            null,
            null,
              true,
          );
        } catch (err) {
          this.Notifications.error('Failure', err, 'Unable to create the environment');
          return;
        } finally {
          $scope.state.actionInProgress = false;
        }

        const config = {
          edgeKey: endpoint.EdgeKey,
          name: $scope.formValues.DeviceName,
          profile: $scope.formValues.DeviceProfile,
        };

        try {
          await configureDevice($scope.deviceID, config);
          Notifications.success('Device successfully imported');
        } catch (err) {
          Notifications.error('Failure', err, 'Unable to import device');
          return;
        } finally {
          $scope.state.actionInProgress = false;
        }

        $state.go('portainer.home');
      });
    };

    async function initView() {
      try {
        $scope.profiles = await getProfiles();
      } catch (err) {
        Notifications.error('Failure', err, 'Unable to load profiles');
        return;
      }

      $q.all({
        groups: GroupService.groups(),
        tags: TagService.tags(),
      })
        .then(function success(data) {
          $scope.groups = data.groups;
          $scope.availableTags = data.tags;
        })
        .catch(function error(err) {
          Notifications.error('Failure', err, 'Unable to load groups');
        });
    }

    initView();
  });
