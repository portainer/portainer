import uuidv4 from 'uuid/v4';

import { PortainerEndpointCreationTypes } from 'Portainer/models/endpoint/models';
import { configureDevice, getProfiles } from 'Portainer/hostmanagement/fdo/fdo.service';

angular
  .module('portainer.app')
  .controller(
    'ImportDeviceController',
    function ImportDeviceController($async, $q, $scope, $state, EndpointService, GroupService, TagService, Notifications, Authentication, FileUploadService) {
      $scope.state = {
        actionInProgress: false,
        vouchersUploading: false,
        vouchersUploaded: false,
        deviceIDs: [],
        allowCreateTag: Authentication.isAdmin(),
      };

      $scope.formValues = {
        DeviceName: '',
        DeviceProfile: '',
        GroupId: 1,
        TagIds: [],
        VoucherFiles: [],
        PortainerURL: '',
        Suffix: 1,
      };

      $scope.profiles = [];

      $scope.onVoucherFilesChange = function () {
        if ($scope.formValues.VoucherFiles.length < 1) {
          return;
        }

        $scope.state.vouchersUploading = true;

        let uploads = $scope.formValues.VoucherFiles.map((f) => FileUploadService.uploadOwnershipVoucher(f));

        $q.all(uploads)
          .then(function success(responses) {
            $scope.state.vouchersUploading = false;
            $scope.state.vouchersUploaded = true;
            $scope.state.deviceIDs = responses.map((r) => r.data.guid);
          })
          .catch(function error(err) {
            $scope.state.vouchersUploading = false;
            if ($scope.formValues.VoucherFiles.length === 1) {
              Notifications.error('Failure', err, 'Unable to upload the Ownership Voucher');
            } else {
              Notifications.error('Failure', null, 'Unable to upload the Ownership Vouchers, please check the logs');
            }
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

          let suffix = $scope.formValues.Suffix;

          for (const deviceID of $scope.state.deviceIDs) {
            let deviceName = $scope.formValues.DeviceName + suffix;

            try {
              var endpoint = await EndpointService.createRemoteEndpoint(
                deviceName,
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
                true
              );
            } catch (err) {
              Notifications.error('Failure', err, 'Unable to create the environment');
              $scope.state.actionInProgress = false;
              return;
            }

            suffix++;

            const config = {
              edgeID: endpoint.EdgeID || uuidv4(),
              edgeKey: endpoint.EdgeKey,
              name: deviceName,
              profile: $scope.formValues.DeviceProfile,
            };

            try {
              await configureDevice(deviceID, config);
            } catch (err) {
              Notifications.error('Failure', err, 'Unable to import device');
              return;
            } finally {
              $scope.state.actionInProgress = false;
            }
          }

          Notifications.success('Device(s) successfully imported');
          $state.go('edge.devices');
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
    }
  );
